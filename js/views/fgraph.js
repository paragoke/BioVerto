if (typeof dc === 'undefined')
    dc = {};
/* @param parent: the ID of the DOM element where the gauge will be hooked up into
 @param chartGroup: the group to which the gauge belongs to (determines when refreshing is done)
 */
dc.fgraph = function(parent) {
    var _fgraph = {}, // main object
            _parentID = parent, // keep track of the parent of an object
            _margins = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
    _nodeData, // current data used by node
            _edgeData, // current data used by edge
            _fCharge = -120, // charge parameter
            _nodeColorType = "cont", // is the coloring measure discrete? "cont" or "disc"
            _nodeColorScaleD = d3.scale.category20(), // colors to be used for nodes when nodeAccessor is discret
            _minNodeColor = "#9674cf",
            _maxNodeColor = "#CC0033",
            _nodeColorScaleC = d3.scale.linear() // same for continous
            .range([_minNodeColor, _maxNodeColor])
            .interpolate(d3.interpolateHcl),
            _edgeColors = d3.scale.category20(), // colors to be used for edges
            _nodeLabelAccessor = function(d) {
                return "";
            },
            _nodeColorAccessor = function(d) {
                return 1;
            }, // node color accessor
            _edgeColorAccessor = function(d) {
                return 1;
            },
            _minNodeSize = 10,
            _maxNodeSize = 15,
            _nodeSizeAccessor = function(d) {
                return _minNodeSize;
            },
            _nodeSizeScale = d3.scale.linear()
            .domain([_minNodeSize, _minNodeSize])
            .range([_minNodeSize, _maxNodeSize]),
            _edgeWidthAccessor = function(d) { // edge color accessor
                return 2;
            }, // controlls the width of the link
            _weightAccessor = function(d) {
                return 2;
            }, // controlls the weight of the node
            _edgeWidthScale = d3.scale.linear().range([1, 10]),
            _linkDistance = 30, // link distance for force
            _linkStrength,
            _force, // force layout
            _svg, // svg element
            _link, // links
            _node, // nodes
            _graph = {}, // data to be displayed
            _width = 960,
            _height = 600,
            _displayNames = true, // should we display names
            _filterFunction= function(d,i){return true;},//function(d,i){return true;},
            _dblclickHandler = function(d) { // handler for what happens under a dbouleclick
                // do nothing
            },
            _indexFunction =function(d){
                return d.data.index
            },
            _theta = 0.8,
            _terminator; // not used, just to terminate list

    // partial redraw of node size
    function changeNodeSize() {
        // recompute the normalization
        _nodeSizeScale.domain(
                d3.extent(_nodeData,
                        function(d) {
                            return _nodeSizeAccessor(d.data);
                        }));
        _node.selectAll("circle")
                .attr("r", function(d) {
                    return _nodeSizeScale(_nodeSizeAccessor(d.data));
                });
    }

    // partial redraw for node colors
    function changeNodeColor() {
        if (_nodeColorType === "cont") {
            _nodeColorScaleC.domain(
                    d3.extent(_nodeData,
                            function(d) {
                                return _nodeColorAccessor(d.data);
                            }))
            _node.selectAll("circle")
                    .style("fill", function(d) {
                        return _nodeColorScaleC(_nodeColorAccessor(d.data));
                    });
        } else {
            _node.selectAll("circle")
                    .style("fill", function(d) {
                        return _nodeColorScaleD(_nodeColorAccessor(d.data));
                    });

        }
    }

   
    function initData(graph) {
        if (!_force)
            _force = d3.layout.force()
                    .charge(_fCharge)
                    .theta(_theta)
                    .linkDistance(_linkDistance)
                    .size([_width, _height]);

        function zoom() {
            _svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }
        if (!_svg) {
            _svg = d3.select(_parentID)
                    .append("svg")
                    .attr("width", _width)
                    .attr("height", _height);

            _svg.append("rect")
                    .attr("width", _width)
                    .attr("height", _height)
                    .style("fill", "none")
                    .style("pointer-events", "all")
                    .call(d3.behavior.zoom().scaleExtent([.0625, 8]).on("zoom", zoom))
            
            _svg = _svg.append("g");
            _svg.append("g")
                    .attr("class", "links");
            _svg.append("g")
                    .attr("class", "nodes");
        }

        // wrap the info in graph so that force layout is happy
        _nodeData = graph.nodes.map(function(d, i) {
            d.index = i;
            return {
                data: d,
                weight: _weightAccessor(d)
            };
        });
        _edgeData = graph.edges.map(function(d, i) {
            d.index = i;
            return {
                //  source: d.source,
                //  target: d.target,
                source: _nodeData[d.source.index],
                target: _nodeData[d.target.index],
                data: d.data,
                //value: d.value                
            };
        });
        _force
                .nodes(_nodeData)
                .links(_edgeData)
                .start();
         _force.on("tick", assignLocations);
        
    }
    function assignLocations()
    {
        _link.attr("x1", function(d) {
                return d.source.x;
            })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });

            _node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
    }
    function drawData(){

        var drag = _force.drag()
                .on("dragstart", function(d) {
                    d.fixed = true;
                    d3.select(this).select("circle").classed("sticky", d.fixed);
                });

       
         
         
         _svg.select(".links").selectAll(".link")
                .data(_edgeData.filter(function(d){return _filterFunction(d.target)&&_filterFunction(d.source)}))
                .exit()
                .transition()
                .remove();
        _newLinks = _svg.select(".links").selectAll(".link")
                .data(_edgeData.filter(function(d){return _filterFunction(d.target)&&_filterFunction(d.source)}))
                .enter().append("line")
                .attr("class", "link")
                .style("stroke", function(d) {
                    return _edgeColors(d.data);
                })
                .style("stroke-width", function(d) {
                    return _edgeWidthAccessor(d.data);
                });
         _newNodes = _svg.select(".nodes").selectAll(".node")
                .data(_nodeData.filter(_filterFunction),_indexFunction)
                .enter().append("g")
                .attr("class", "node")
                .call(drag)
        _svg.select(".nodes").selectAll(".node")
                .data(_nodeData.filter(_filterFunction),_indexFunction)
                .exit()
                .transition()
                .remove();
                
        _newNodes .append("circle")
                .attr("class", "fgraph-circle")
                .on("dblclick", function(d) {
                    d.fixed = false;
                    d3.select(this).classed("sticky", d.fixed);
                    _force.start();
                });       
        _newNodes.append("title")
                .text(function(d) {
                    return d.name;
                });

        _newNodes.append("text")
                .attr("class", "fgraph-text")
                .text(function(d) {
                    return _nodeLabelAccessor(d);
                });
         _node = _svg.selectAll(".node");
         _link = _svg.selectAll(".link");
        changeNodeSize();
        changeNodeColor();
        changeNodeLabel();
        assignLocations();
    }
    function changeNodeLabel() {
         _node.selectAll("text")
                .text(function(d) {
                    return _nodeLabelAccessor(d.data);
                });
    }
           
    _fgraph.filterFunction = function(_)
    {
        _filterFunction = _;
        drawData();
    }
    _fgraph.init = function(parent, data, width, height) {
        _parentID = parent;
        _fgraph.graphView(data)
                .resize(width, height);
       drawData();
        return _fgraph;
    }
    _fgraph.destroy = function()
    {
        $(_parentID).empty();
    }
    _fgraph.graphView = function(_) {
        if (!arguments.length)
            return _graph;
        _graph = _;
        initData(_graph);
        return _fgraph;
    };

    _fgraph.resize = function(width, height) {
        _width = width;
        _height = height;

        if (_svg)
            d3.select(_parentID)
                    .select("svg")
                    .attr("width", _width)
                    .attr("height", _height)
                    .select("rect")
                    .attr("width", _width)
                    .attr("height", _height)
                    ;

        if (_force)
            _force.size([width, height]).start();
        return _fgraph;
    };
    _fgraph.nodeData = function()
    {
        return _nodeData;
    }
    _fgraph.highlightNode = function(nodenum)
    {
        _svg.selectAll("circle").filter(function(d) {
            return d.data.data.id === nodenum
        }).style("fill", "red");
    }
    _fgraph.updateEgdeStyle = function(style, fn) {
        _link.style(style, fn);
    }
    // should we display names for nodes?
    _fgraph.displayNames = function(_) {
        if (!arguments.length)
            return _displayNames;
        _displayNames = _;

        if (_displayNames)
            _node.append("text")
                    .text(function(d) {
                        return d.name;
                    });
        else {
            _node.selectAll("text").remove();
        }

        // _fgraph.doRedraw();
        return _fgraph;
    }

    // Change/get distance parametter of force
    _fgraph.distance = function(_) {
        if (!arguments.length)
            return _linkDistance;
        _linkDistance = _;
        _force.linkDistance(_linkDistance).start();
        return _fgraph;
    }

    // Change/get strength parameter of force
    _fgraph.strength = function(_) {
        if (!arguments.length)
            return _linkStrength;
        _linkStrength = _;
        _force.linkStrength(_linkStrength).start();
        return _fgraph;
    }

    // Change/get charge for graph
    _fgraph.charge = function(_) {
        if (!arguments.length)
            return _fCharge;
        _fCharge = _;
        _force.charge(_fCharge).start();
        return _fgraph;
    }


    _fgraph.edgeColors = function(_) {
        if (!arguments.length)
            return _edgeColors;
        _edgeColors = _;

        _fgraph.updateEgdeStyle("stroke", _);
        return _fgraph;
    }



    _fgraph.edgeColorAccessor = function(_) {
        if (!arguments.length)
            return _edgeColorAccessor;
        _edgeColorAccessor = _;
        return _fgraph;
    };

    _fgraph.weightAccessor = function(_) {
        if (!arguments.length)
            return _weightAccessor;
        // TODO, enforce the changes
        _weightAccessor = _;
        return _fgraph;
    };

    _fgraph.nodeColorAccessor = function(_) {
        if (!arguments.length)
            return _nodeColorAccessor;
        _nodeColorAccessor = _;
        return _fgraph;
    };
    _fgraph.nodeSizeAcessor = function(_) {
        _nodeSizeAccessor = (typeof _ === 'function') ? _ : function(d) {
            return _minNodeSize;
        };
        changeNodeSize();
    };

    _fgraph.minNodeSize = function(_) {
        _minNodeSize = (typeof _ === 'number') ? _ : 5;
        _nodeSizeScale.range([_minNodeSize, _maxNodeSize]);
        changeNodeSize();
    };

    _fgraph.maxNodeSize = function(_) {
        _maxNodeSize = (typeof _ === 'number') ? _ : 15;
        _nodeSizeScale.range([_minNodeSize, _maxNodeSize]);
        changeNodeSize();
    };

    _fgraph.nodeLabelAcessor = function(_) {
        _nodeLabelAccessor = (typeof _ === 'function') ? _ : function(d) {
            
            return "";
        };
        changeNodeLabel();
    };

    _fgraph.nodeColorAcessor = function(_) {
        _nodeColorAccessor = (typeof _ === 'function') ? _ : function(d) {
            return 1;
        };
        // if function and type defined is continous
        _nodeColorType = (typeof _ === 'function' && _.returnType === "number") ? "cont" : "disc";
        changeNodeColor();
        return _fgraph;
    };

    _fgraph.minNodeColor = function(_) {
        _minNodeColor = (typeof _ === 'string') ? _ : "blue";
        _nodeColorScaleC.range([_minNodeColor, _maxNodeColor]);
        changeNodeColor();
        return _fgraph;
    };

    _fgraph.maxNodeColor = function(_) {
        _maxNodeColor = (typeof _ === 'string') ? _ : "red";
        _nodeColorScaleC.range([_minNodeColor, _maxNodeColor]);
        changeNodeColor();
        return _fgraph;
    };

    _fgraph.dblclickHandler = function(_) {
        _dblclickHandler = (typeof _ === 'function') ? _ :
                function(d) {
                };
        return _fgraph;
    }
    return _fgraph;
};
