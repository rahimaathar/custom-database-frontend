import { TreePine, ChevronRight, ChevronDown, Circle, Square, Search, RotateCcw, ArrowRight, ZoomIn, ZoomOut, Move } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface TreeNode {
    type: 'leaf' | 'internal';
    keys: string[];
    values?: string[];
    children?: TreeNode[];
    is_leaf: boolean;
    level: number;
}

interface TreeResponse {
    success: boolean;
    message: string;
    root: TreeNode | null;
    depth: number;
    node_count: number;
}

interface SearchResult {
    found: boolean;
    path: string[];
    node: TreeNode | null;
    searchTime?: number;
}

interface D3Node {
    name: string;
    children?: D3Node[];
    nodeType: 'leaf' | 'internal';
    keys: string[];
    values?: string[];
    level: number;
    isSearchResult?: boolean;
    isInSearchPath?: boolean;
    searchFound?: boolean;
    nodeId: string;
}

interface TreeStats {
    depth: number;
    totalNodes: number;
    leafNodes: number;
    totalKeys: number;
    averageKeysPerNode: number;
    treeBalance: string;
}

export default function BPTreeVisualizer() {
    const [treeData, setTreeData] = useState<TreeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [loadingStartTime, setLoadingStartTime] = useState<number>(0);
    const [searchKey, setSearchKey] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showValues, setShowValues] = useState(false);
    const [highlightMode, setHighlightMode] = useState<'none' | 'search' | 'path'>('none');
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);


    const fetchTreeData = useCallback(async (force: boolean = false) => {
        console.log(`🌳 BPTreeVisualizer: fetchTreeData called, force=${force}`);

      
        const now = Date.now();
        if (!force && now - lastFetchTime < 10000) { 
            console.log('🌳 BPTreeVisualizer: Skipping fetch due to rate limiting (10s minimum)');
            return;
        }

        console.log(`🌳 BPTreeVisualizer: fetchTreeData called, force=${force}, timeSinceLast=${now - lastFetchTime}ms`);

        if (!force && now - lastFetchTime < 30000) { 
            console.log('BPTreeVisualizer: Skipping fetch due to debounce');
            return;
        }

        
        if (isLoading && !force) {
            console.log('BPTreeVisualizer: Skipping fetch due to loading state');
            return;
        }

        try {
            setIsLoading(true);
            setLoadingStartTime(now);
            setError(null);

            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); 

            const response = await axios.get('/api/tree', {
                signal: controller.signal,
                timeout: 15000,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (response.data.success) {
                setTreeData(response.data);
                setLastFetchTime(now);
            } else {
                setError(new Error(response.data.message || 'Failed to fetch tree data'));
            }
        } catch (error: any) {
            console.error('BPTreeVisualizer - Fetch error:', error);
            if (error.name === 'AbortError') {
                setError(new Error('Request timed out. Tree data may be too large.'));
            } else if (error.code === 'ECONNRESET') {
                setError(new Error('Connection reset. The tree data is too large. Try refreshing.'));
            } else if (error.code === 'ECONNREFUSED') {
                setError(new Error('Backend server is not running. Please start the C++ backend.'));
            } else {
                setError(new Error(`Network error: ${error.message}`));
            }
        } finally {
            
            const elapsed = Date.now() - loadingStartTime;
            const minLoadingTime = 1000; 

            if (elapsed < minLoadingTime) {
                setTimeout(() => setIsLoading(false), minLoadingTime - elapsed);
            } else {
                setIsLoading(false);
            }
        }
    }, [lastFetchTime, loadingStartTime, isLoading]);

  
    useEffect(() => {
        console.log('🌳 BPTreeVisualizer: Component mounted, fetching initial data');
        fetchTreeData(true); 
    }, []); 


    const convertToD3Format = useCallback((node: TreeNode, searchKey?: string, searchResult?: SearchResult, nodeId: string = 'root'): D3Node => {
        const isSearchResult = searchResult?.node === node;
        const isInSearchPath = searchResult?.path.some(path => path.includes(`Level ${node.level}`));

        const d3Node: D3Node = {
            name: `${node.type} (Level ${node.level})`,
            nodeType: node.type,
            keys: node.keys,
            values: node.values,
            level: node.level,
            isSearchResult,
            isInSearchPath,
            searchFound: searchResult?.found,
            nodeId
        };

        if (node.children && node.children.length > 0) {
            d3Node.children = node.children.map((child, index) =>
                convertToD3Format(child, searchKey, searchResult, `${nodeId}-${index}`)
            );
        }

        return d3Node;
    }, []);

   
    const calculateTreeStats = useCallback((node: TreeNode): TreeStats => {
        const countNodes = (n: TreeNode): { total: number; leaf: number; keys: number } => {
            let total = 1;
            let leaf = n.is_leaf ? 1 : 0;
            let keys = n.keys.length;

            if (n.children) {
                for (const child of n.children) {
                    const childStats = countNodes(child);
                    total += childStats.total;
                    leaf += childStats.leaf;
                    keys += childStats.keys;
                }
            }

            return { total, leaf, keys };
        };

        const stats = countNodes(node);
        const avgKeysPerNode = stats.total > 0 ? (stats.keys / stats.total).toFixed(1) : '0';

        const balance = stats.total <= 1 ? 'Perfect' :
            stats.total <= 3 ? 'Good' :
                stats.total <= 5 ? 'Fair' : 'Complex';

        return {
            depth: treeData?.depth || 1,
            totalNodes: stats.total,
            leafNodes: stats.leaf,
            totalKeys: stats.keys,
            averageKeysPerNode: parseFloat(avgKeysPerNode),
            treeBalance: balance
        };
    }, [treeData]);


    const searchInTree = useCallback((node: TreeNode, key: string): SearchResult => {
        const startTime = performance.now();
        const path: string[] = [];
        let currentNode: TreeNode | null = node;

        while (currentNode) {
            path.push(`Level ${currentNode.level}: ${currentNode.type} node`);

            if (currentNode.is_leaf) {
                const found = currentNode.keys.includes(key);
                const searchTime = performance.now() - startTime;
                return {
                    found,
                    path,
                    node: found ? currentNode : null,
                    searchTime
                };
            } else {
                let childIndex = 0;
                for (let i = 0; i < currentNode.keys.length; i++) {
                    if (key < currentNode.keys[i]) {
                        break;
                    }
                    childIndex = i + 1;
                }

                if (currentNode.children && currentNode.children[childIndex]) {
                    currentNode = currentNode.children[childIndex];
                } else {
                    break;
                }
            }
        }

        const searchTime = performance.now() - startTime;
        return { found: false, path, node: null, searchTime };
    }, []);

    
    const handleSearch = useCallback(async () => {
        if (!searchKey.trim() || !treeData?.root) return;

        setIsSearching(true);
        setSearchResult(null);

        try {
            const result = searchInTree(treeData.root, searchKey.trim());
            setSearchResult(result);

    
            setSearchHistory(prev => [result, ...prev.slice(0, 4)]);

            const response = await axios.post('/api/query', {
                query: `GET "${searchKey.trim()}"`
            });

            if (response.data.success && response.data.data.length > 0) {
                setSearchResult(prev => prev ? { ...prev, found: true } : null);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchKey, treeData, searchInTree]);


    const handleReset = useCallback(() => {
        setSearchKey('');
        setSearchResult(null);
        setSearchHistory([]);
        setHighlightMode('none');
        setZoomLevel(1);

   
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            (svg as any).call(d3.zoom().transform, d3.zoomIdentity);
        }
    }, []);

 
    const handleRefresh = useCallback(async () => {
        await fetchTreeData(true);
    }, [fetchTreeData]);

    const getAllKeysSorted = useCallback((node: TreeNode): string[] => {
        if (node.is_leaf) {
            return [...node.keys].sort();
        }

        const keys: string[] = [];
        if (node.children) {
            for (const child of node.children) {
                keys.push(...getAllKeysSorted(child));
            }
        }
        return keys.sort();
    }, []);

 
    useEffect(() => {
        if (!treeData?.root || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 1000;
        const height = 700;
        const margin = { top: 40, right: 120, bottom: 40, left: 120 };

        
        const defs = svg.append("defs");

        
        const leafGradient = defs.append("linearGradient")
            .attr("id", "leafGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        leafGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#10b981");

        leafGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#059669");

    
        const internalGradient = defs.append("linearGradient")
            .attr("id", "internalGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        internalGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#3b82f6");

        internalGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1d4ed8");

   
        const searchGradient = defs.append("linearGradient")
            .attr("id", "searchGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        searchGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#fbbf24");

        searchGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#f59e0b");


        const tree = d3.tree<D3Node>().size([height - margin.top - margin.bottom, width - margin.right - margin.left]);
        const root = d3.hierarchy(convertToD3Format(treeData.root, searchKey, searchResult || undefined));
        const d3TreeData = tree(root);

     
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.3, 3])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
                setZoomLevel(event.transform.k);
            });

        svg.call(zoom);

 
        const container = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const link = container.selectAll(".link")
            .data(d3TreeData.links())
            .enter().append("path")
            .attr("class", "link d3-link-path")
            .attr("d", (d3.linkHorizontal() as any)
                .x((d: any) => d.y)
                .y((d: any) => d.x))
            .style("fill", "none")
            .style("stroke", "#94a3b8")
            .style("stroke-width", "3px")
            .style("opacity", 0.6)
            .style("stroke-linecap", "round");

    
        const node = container.selectAll(".node")
            .data(d3TreeData.descendants())
            .enter().append("g")
            .attr("class", "node d3-node")
            .attr("transform", d => `translate(${d.y},${d.x})`);

      
        node.append("circle")
            .attr("r", 12)
            .style("fill", d => {
                if (d.data.isSearchResult) {
                    return d.data.searchFound ? "url(#leafGradient)" : "#ef4444";
                }
                if (d.data.isInSearchPath) {
                    return "url(#searchGradient)";
                }
                return d.data.nodeType === "leaf" ? "url(#leafGradient)" : "url(#internalGradient)";
            })
            .style("stroke", d => {
                if (d.data.isSearchResult) {
                    return d.data.searchFound ? "#059669" : "#dc2626";
                }
                if (d.data.isInSearchPath) {
                    return "#f59e0b";
                }
                return "#1f2937";
            })
            .style("stroke-width", "3px")
            .style("cursor", "pointer")
            .style("filter", "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15))")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .style("stroke-width", "4px")
                    .style("filter", "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))")
                    .transition()
                    .duration(200)
                    .attr("r", 15);
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .style("stroke-width", "3px")
                    .style("filter", "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15))")
                    .transition()
                    .duration(200)
                    .attr("r", 12);
            });

      
        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -18 : 18)
            .style("text-anchor", d => d.children ? "end" : "start")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .style("text-shadow", "2px 2px 4px rgba(0, 0, 0, 0.7)")
            .text(d => d.data.nodeType === "leaf" ? "L" : "I");

       
        const nodeDetails = node.append("g")
            .attr("class", "node-details d3-node-details")
            .attr("transform", d => `translate(${d.children ? -100 : 25}, -50)`);

        
        nodeDetails.append("rect")
            .attr("width", 200)
            .attr("height", d => Math.max(30, d.data.keys.length * 20 + 20))
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", d => {
                if (d.data.isSearchResult) {
                    return d.data.searchFound ? "#d1fae5" : "#fee2e2";
                }
                if (d.data.isInSearchPath) {
                    return "#fef3c7";
                }
                return "#f8fafc";
            })
            .style("stroke", d => {
                if (d.data.isSearchResult) {
                    return d.data.searchFound ? "#10b981" : "#ef4444";
                }
                if (d.data.isInSearchPath) {
                    return "#f59e0b";
                }
                return "#e2e8f0";
            })
            .style("stroke-width", "2px")
            .style("filter", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))");

        nodeDetails.selectAll(".key")
            .data(d => {
               
                const maxKeys = 20;
                if (d.data.keys.length > maxKeys) {
                    return d.data.keys.slice(0, maxKeys);
                }
                return d.data.keys;
            })
            .enter().append("text")
            .attr("class", "key d3-key-text")
            .attr("x", 8)
            .attr("y", (d, i) => i * 18 + 15)
            .style("font-size", "11px")
            .style("font-family", "Monaco, Menlo, Ubuntu Mono, monospace")
            .style("fill", d => {
                if (searchKey && d === searchKey && searchResult?.found) {
                    return "#059669";
                }
                return "#374151";
            })
            .style("font-weight", d => {
                if (searchKey && d === searchKey && searchResult?.found) {
                    return "bold";
                }
                return "normal";
            })
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .style("font-weight", "bold")
                    .style("fill", "#1f2937");
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .style("font-weight", searchKey && d === searchKey && searchResult?.found ? "bold" : "normal")
                    .style("fill", searchKey && d === searchKey && searchResult?.found ? "#059669" : "#374151");
            })
            .text(d => d.length > 10 ? d.substring(0, 10) + "..." : d);

       
        nodeDetails.filter(d => d.data.keys.length > 20).append("text")
            .attr("x", 8)
            .attr("y", 21 * 18 + 15)
            .style("font-size", "11px")
            .style("font-family", "Monaco, Menlo, Ubuntu Mono, monospace")
            .style("fill", "#6b7280")
            .style("font-style", "italic")
            .text(`... and ${(d: any) => d.data.keys.length - 20} more keys`);

     
        if (showValues && treeData.root?.values) {
            nodeDetails.selectAll(".value")
                .data(d => d.data.values || [])
                .enter().append("text")
                .attr("class", "value")
                .attr("x", 110)
                .attr("y", (d, i) => i * 20 + 18)
                .style("font-size", "11px")
                .style("font-family", "Monaco, Menlo, Ubuntu Mono, monospace")
                .style("fill", "#6b7280")
                .style("font-style", "italic")
                .text(d => d.length > 8 ? d.substring(0, 8) + "..." : d);
        }

    
        nodeDetails.append("text")
            .attr("x", 10)
            .attr("y", -10)
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "#6b7280")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.5px")
            .text(d => d.data.nodeType.toUpperCase());

 
        nodeDetails.append("circle")
            .attr("cx", 180)
            .attr("cy", 10)
            .attr("r", 10)
            .style("fill", "#3b82f6")
            .style("stroke", "#1d4ed8")
            .style("stroke-width", "1px");

        nodeDetails.append("text")
            .attr("x", 180)
            .attr("y", 14)
            .style("text-anchor", "middle")
            .style("font-size", "9px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .text(d => d.data.keys.length);

      
        if (treeData.root?.is_leaf) {
          
        } else {
           
            const leafNodes = d3TreeData.descendants().filter(d => d.data.nodeType === 'leaf');
            for (let i = 0; i < leafNodes.length - 1; i++) {
                const current = leafNodes[i];
                const next = leafNodes[i + 1];

                container.append("path")
                    .attr("class", "leaf-connection")
                    .attr("d", `M${current.y + 25} ${current.x} L${next.y - 25} ${next.x}`)
                    .style("fill", "none")
                    .style("stroke", "#10b981")
                    .style("stroke-width", "2px")
                    .style("stroke-dasharray", "5,5")
                    .style("opacity", 0.6);
            }
        }

    }, [treeData, searchKey, searchResult, showValues, convertToD3Format]);


    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
                <TreePine className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-red-900 mb-1">Failed to load tree</h3>
                <p className="text-sm text-red-700">
                    Unable to fetch B+ tree structure from the server.
                </p>
                <button
                    onClick={handleRefresh}
                    className="mt-4 btn-primary btn-md"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!treeData || !treeData.success) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
                <TreePine className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-yellow-900 mb-1">No tree data</h3>
                <p className="text-sm text-yellow-700">
                    {treeData?.message || 'The database is empty or no tree structure is available.'}
                </p>
                <button
                    onClick={handleRefresh}
                    className="mt-4 btn-primary btn-md"
                >
                    Refresh
                </button>
            </div>
        );
    }

    const treeStats = treeData.root ? calculateTreeStats(treeData.root) : null;

    return (
        <div className="space-y-6">
         
            {treeStats && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <TreePine className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium text-blue-900">Tree Depth</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-blue-700">{treeStats.depth}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <Square className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-green-900">Total Nodes</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-green-700">{treeStats.totalNodes}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <Circle className="h-5 w-5 text-purple-500" />
                            <span className="text-sm font-medium text-purple-900">Leaf Nodes</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-purple-700">{treeStats.leafNodes}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-orange-500" />
                            <span className="text-sm font-medium text-orange-900">Total Keys</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-orange-700">{treeStats.totalKeys}</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 text-indigo-500 flex items-center justify-center">
                                <span className="text-xs font-bold">Ø</span>
                            </div>
                            <span className="text-sm font-medium text-indigo-900">Avg Keys/Node</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-indigo-700">{treeStats.averageKeysPerNode}</p>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 rounded-md p-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 text-pink-500 flex items-center justify-center">
                                <span className="text-xs font-bold">⚖</span>
                            </div>
                            <span className="text-sm font-medium text-pink-900">Balance</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-pink-700">{treeStats.treeBalance}</p>
                    </div>
                </div>
            )}

     
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                    <Search className="h-5 w-5 text-gray-500" />
                    <span>Interactive Search Visualization</span>
                </h4>
                <div className="flex space-x-4 mb-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Enter key to visualize search path (e.g., user:66, product:101)"
                            value={searchKey}
                            onChange={(e) => setSearchKey(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchKey.trim()}
                        className="btn-primary btn-md flex items-center space-x-2"
                    >
                        {isSearching ? (
                            <div className="spinner w-4 h-4" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        <span>Search</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="btn-outline btn-md flex items-center space-x-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={() => fetchTreeData(true)}
                        disabled={isLoading}
                        className="btn-outline btn-md flex items-center space-x-2"
                    >
                        <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Tree</span>
                    </button>
                </div>

                <div className="flex items-center space-x-6 mb-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={showValues}
                            onChange={(e) => setShowValues(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show Values</span>
                    </label>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Animation Speed:</span>
                        <input
                            type="range"
                            min="100"
                            max="1000"
                            step="100"
                            value={animationSpeed}
                            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                            className="w-20"
                        />
                        <span className="text-xs text-gray-500">{animationSpeed}ms</span>
                    </div>
                </div>

                {searchResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Search Results:</h5>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-sm px-2 py-1 rounded ${searchResult.found
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {searchResult.found ? 'Found' : 'Not Found'}
                                </span>
                                {searchResult.searchTime && (
                                    <span className="text-xs text-gray-500">
                                        ({searchResult.searchTime.toFixed(2)}ms)
                                    </span>
                                )}
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Search Path:</span>
                                <div className="mt-1 flex items-center space-x-1 flex-wrap">
                                    {searchResult.path.map((step, index) => (
                                        <div key={index} className="flex items-center">
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {step}
                                            </span>
                                            {index < searchResult.path.length - 1 && (
                                                <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

              
                {searchHistory.length > 0 && (
                    <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Searches:</h5>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.map((result, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSearchKey(searchKey);
                                        setSearchResult(result);
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${result.found
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    {result.found ? '✓' : '✗'} {searchKey}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

           
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <TreePine className="h-5 w-5 text-gray-500" />
                        <h4 className="text-lg font-medium text-gray-900">Interactive B+ Tree Visualization</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                if (svgRef.current) {
                                    const svg = d3.select(svgRef.current);
                                    (svg as any).call(d3.zoom().transform, d3.zoomIdentity.scale(1.5));
                                }
                            }}
                            className="btn-outline btn-md flex items-center space-x-2"
                        >
                            <ZoomIn className="h-4 w-4" />
                            <span>Zoom In</span>
                        </button>
                        <button
                            onClick={() => {
                                if (svgRef.current) {
                                    const svg = d3.select(svgRef.current);
                                    (svg as any).call(d3.zoom().transform, d3.zoomIdentity.scale(0.7));
                                }
                            }}
                            className="btn-outline btn-md flex items-center space-x-2"
                        >
                            <ZoomOut className="h-4 w-4" />
                            <span>Zoom Out</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="btn-outline btn-md flex items-center space-x-2"
                        >
                            {isLoading ? (
                                <div className="spinner w-4 h-4" />
                            ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            )}
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

               
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Current Tree State</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p>• <strong>Structure:</strong> {treeData.root?.is_leaf ? 'Single Leaf Node' : 'Multi-level Tree'}</p>
                        <p>• <strong>Keys per Node Limit:</strong> 100 (B+ tree will split when exceeded)</p>
                        <p>• <strong>Status:</strong> {treeData.root && treeData.root.keys.length >= 100 ? 'Ready to split' : 'Growing normally'}</p>
                        <p>• <strong>Zoom Level:</strong> {zoomLevel.toFixed(2)}x</p>
                    </div>
                </div>

                
                <div className="flex justify-center">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="spinner w-12 h-12 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 mb-2">Loading tree structure...</p>
                                <p className="text-xs text-gray-400">This may take a moment for large datasets</p>
                            </div>
                        </div>
                    ) : (
                        <div className="d3-tree-container" ref={containerRef}>
                            <svg
                                ref={svgRef}
                                width="1000"
                                height="700"
                                className="d3-tree-svg bg-white"
                            />
                        </div>
                    )}
                </div>

                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-600"></div>
                        <span className="text-gray-700">Internal Node</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
                        <span className="text-gray-700">Leaf Node</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-500"></div>
                        <span className="text-gray-700">Search Path</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-green-500"></div>
                        <span className="text-gray-700">Found Key</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-red-500"></div>
                        <span className="text-gray-700">Not Found</span>
                    </div>
                </div>
            </div>

            
            {treeData.root && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Sorted Key Traversal</h4>
                    <div className="flex flex-wrap gap-2">
                        {getAllKeysSorted(treeData.root).map((key, index) => (
                            <span
                                key={index}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-mono transition-all ${searchResult?.found && key === searchKey
                                    ? 'bg-green-200 text-green-800 ring-2 ring-green-400'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {key}
                            </span>
                        ))}
                    </div>
                </div>
            )}

       
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">How B+ Trees Work</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-900">Current State</h5>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>• <strong>Single Leaf Node:</strong> All keys are stored in one leaf node</p>
                            <p>• <strong>Lexicographical Order:</strong> Keys are sorted alphabetically</p>
                            <p>• <strong>Linked Structure:</strong> Leaf nodes would be linked for range queries</p>
                            <p>• <strong>Search Efficiency:</strong> O(log n) when tree splits occur</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-900">When Tree Splits</h5>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>• <strong>Trigger:</strong> When a node exceeds 100 keys</p>
                            <p>• <strong>Process:</strong> Node splits into two, middle key moves up</p>
                            <p>• <strong>Result:</strong> Creates internal nodes and multiple leaf nodes</p>
                            <p>• <strong>Benefit:</strong> Maintains balanced tree structure</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start space-x-2">
                        <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">Interactive Features:</p>
                            <p>• Zoom in/out with mouse wheel or buttons • Pan by dragging • Hover over nodes for details • Search to highlight paths • Toggle value display • Adjust animation speed</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
