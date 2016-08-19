epiviz_scatter = function() {

    // containers
    var _container,
        _svg,
        _legend,
        _axis,
        _chartContent,
        _tooltip,

        // data
        _origData,
        _data,
        _xMin, _xMax, _yMin, _yMax,
        _xKey = "x", //x value to plot
        _yKey = "y", //y value to plot
        _key = "key", //key to combine x and y
        _groupBy = null,

        // chart attributes
        _width = 400, //default value
        _height = 400, //default value
        _xScale,
        _yScale,
        _xAxis,
        _yAxis,
        _circleRadius = 4,
        _margins = { top: 50, right: 20, bottom: 20, left: 50 },
        _legendWidth = 75,

        // colors-array
        _colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],

        // events
        _dispatch = d3.dispatch("hover", "click"),

        // UI enhancements
        _enableTooltip = true,
        _uiGridLines = true,
        _chartDrawn = false,
        _showLegend = true;

    function _drawAxis() {

        _axis.selectAll(".axis").remove();

        var cWidth = _width - _margins.left - _margins.right;
        var cHeight = _height - _margins.top - _margins.bottom;

        _xScale = d3.scale.linear().domain(
                d3.extent(_origData, function(d) {
                    return d[_xKey];
                })
            )
            .range([0, cWidth])
            .nice();

        _yScale = d3.scale.linear().domain(
                d3.extent(_origData, function(d) {
                    return d[_yKey];
                })
            )
            .range([cHeight, 0])
            .nice();

        _xAxis = d3.svg.axis().scale(_xScale).orient("bottom");
        _yAxis = d3.svg.axis().scale(_yScale).orient("left");

        if (_uiGridLines) {
            _xAxis.tickSize(-cHeight, 0, 0);
            _yAxis.tickSize(-cWidth, 0, 0);
        }

        _axis.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (cHeight) + ")")
            .call(_xAxis)
            .append("text")
            .attr("class", "label")
            .attr('font-weight', 'bold')
            .attr("x", (cWidth) / 2)
            .attr('y', _margins.bottom * 2)
            .style("text-anchor", "middle")
            .text(_xKey);

        _axis.append("g")
            .attr("class", "axis y-axis")
            .call(_yAxis)
            .append("text")
            .attr("class", "label")
            .attr("y", -(0.75 * _margins.left))
            .attr("x", -(cHeight) / 2)
            .attr("transform", "rotate(-90)")
            .attr('font-weight', 'bold')
            .style("text-anchor", "middle")
            .text(_yKey);
    }

    function _drawLegend(groups) {

        _legend.selectAll(".legend-item").remove();

        var lItems = _legend.selectAll(".legend-item")
            .data(groups);

        lItems.enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        lItems.append("rect")
            .attr("x", _width + 5)
            .attr("width", 10)
            .attr('height', 10)
            .attr("fill", function(d, i) {
                return _getColor(i);
            });

        lItems.append("text")
            .attr("x", _width + 25)
            .attr("y", 5)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {
                return d;
            });
    }

    function _getColor(index) {

        var cLen = _colors.length;
        var i = index >= cLen ? index - cLen : index;

        return _colors[i];
    }

    function _drawSeries(data, seriesIndex) {

        var selection = _chartContent.append('g')
            .attr("class", "series series-" + seriesIndex);

        var series = selection.selectAll("circle")
            .data(data);

        series.enter().append("circle")
            .attr("class", "unhovered")
            .attr("cx", function(d) {
                return _xScale(d[_xKey]);
            })
            .attr("cy", function(d) {
                return _yScale(d[_yKey]);
            })
            .attr("fill", function(d) {
                return _getColor(seriesIndex);
            })
            .attr("r", _circleRadius)
            .on("mouseover", _mouseover)
            .on("mouseout", _mouseout);
    }

    function _draw() {

        _chartContent.selectAll(".series").remove();

        // if data grouped
        if (_groupBy != null) {
            var groupedData = _groupData(_data, _groupBy);
            var groups = Object.keys(groupedData);

            if (_showLegend) {
                _drawLegend(groups);
            }

            for (var g = 0; g < groups.length; g++) {
                _drawSeries(groupedData[groups[g]].values, g);
            }
        } else {
            _drawSeries(_data, 0);
        }
    }

    function _mouseover(d, i) {
        var circle = d3.select(this);
        circle.attr("class", "hovered");
        _dispatch.hover([d]);

        if (_enableTooltip) {
            _tooltip.transition()
                .duration(200)
                .style("opacity", 0.7);

            _tooltip.html(d[_xKey] + "<br/>" + d[_yKey])
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }
    }

    function _mouseout(d, i) {
        var circle = d3.select(this);
        circle.attr("class", "unhovered");
        _dispatch.hover([]);

        if (_enableTooltip) {
            _tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }
    }

    function _collapseData(data) {
        var grouped = d3.nest()
            .key(function(d) {
                return d[_xKey];
            })
            .key(function(d) {
                return d[_yKey];
            })
            .entries(data);

        //format groups into a json format;

        var gData = [];

        // // TODO: sync data iteration
        // for (var k1 = 0; k1 < grouped.length; k1++) {
        //     var tempObj = {};

        //     var xobj = grouped[k1];
        //     tempObj[_xKey] = parseInt(xobj.key);

        //     for (var k2 = 0; k2 < xobj.values.length; k2++) {
        //         var yobj = xobj.values[k2];
        //         tempObj[_yKey] = parseInt(yobj.key);

        //         tempObj[_key] = [];
        //         for (val = 0; val < yobj.values.length; val++) {
        //             tempObj[_key].push(yobj.values[val][_key]);
        //         }
        //         gData.push(tempObj);
        //     }
        // }

        grouped.forEach(function(k1) {
            var tempObj = {};
            tempObj[_xKey] = parseInt(k1.key);
            k1.values.forEach(function(k2) {
                tempObj[_yKey] = parseInt(k2.key);
                tempObj[_key] = [];
                k2.values.forEach(function(val) {
                    tempObj[_key].push(val[_key]);
                });
                gData.push(tempObj);
            });
        });

        return gData;
    }

    function _groupData(data, group) {

        var grouped = d3.nest()
            .key(function(d) {
                return d[group];
            })
            .entries(data);

        return grouped;
    }

    function _filterData(data, xMin, xMax, yMin, yMax) {

        var xMinMax = d3.extent(data, function(d) {
            return d[_xKey];
        });

        var yMinMax = d3.extent(data, function(d) {
            return d[_yKey];
        });

        var xMin = xMin || xMinMax[0];
        var xMax = xMax || xMinMax[1];
        var yMin = yMin || yMinMax[0];
        var yMax = yMax || yMinMax[1];

        var tempdata = data.filter(function(d) {
            return ((d[_xKey] >= xMin && d[_xKey] <= xMax) && (d[_yKey] >= yMin && d[_yKey] <= yMax));
        });

        return tempdata;
    }

    //export public api

    var chart = {};

    chart.highlight = function(data) {
        // data is the value to highlight using _key!

        var toHighlightCircles = _container.selectAll("circle")
            .attr("class", "unhovered")
            .filter(function(d) {
                return d[_key] == data;
            });

        toHighlightCircles.attr("class", "hovered");
    }

    chart.dispatch = _dispatch;
    chart.xAxis = _xAxis;
    chart.yAxis = _yAxis;

    chart.margins = _margins;
    chart.width = _width;
    chart.height = _height;


    chart.init = function(container) {
        _container = d3.select(container);

        // Add svg element
        _svg = _container
            .append('svg')
            .attr("width", (_width + _legendWidth))
            .attr("height", _height)
            .append("g")
            .attr("transform", "translate(" + (_margins.left) + "," + (_margins.top) + ")");

        _tooltip = _container.append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var chartLegend = _svg.append('g')
            .attr("class", "chart-outline");

        // Legend
        _legend = chartLegend.append('g')
            .attr("class", "chart-legend");

        //Axis
        _axis = chartLegend.append('g')
            .attr("class", "chart-axis")
            .attr("transform", "translate(20,-20)");

        //Actual Chart Data
        _chartContent = _svg.append('g')
            .attr("class", "chart-content")
            .attr("transform", "translate(20,-20)");

        return chart;
    }


    chart.setData = function(data) {
        _origData = data;

        // TODO: use service worker/ web workers. 
        // merge data points if they are close to each other
        //_data = _collapseData(_origData);
        //_data = _groupData(_data, _groupBy);
        _data = _origData;

        return chart;
    }

    // TODO also be able to send dataX and dataY
    chart.create = function(container, data) {

        this.init(container);
        this.setData(data);

        return chart;
    }

    chart.useKeys = function(xKey, yKey, key) {
        _xKey = xKey || _xKey;
        _yKey = yKey || _yKey;
        _key = key || _key;

        _data = _collapseData(_origData);

        if (_chartDrawn) {
            _drawAxis();
            _draw();
        }

        return chart;
    }

    chart.setProperties = function(circleRadius, groupBy) {
        _circleRadius = circleRadius || 4;
        _groupBy = groupBy || null;

        if (_chartDrawn) {
            _draw();
        }

        return chart;
    }

    chart.setDataBoundaries = function(xMin, xMax, yMin, yMax) {

        _data = _filterData(_data, xMin, xMax, yMin, yMax);

        if (_chartDrawn) {
            _draw();
        }

        return chart;
    }

    chart.setColors = function(colors) {
        _colors = colors;

        if (_chartDrawn) {
            _draw();
        }

        return chart;
    }

    chart.draw = function() {

        _chartDrawn = true;

        _drawAxis();
        _draw();
    }

    d3.rebind(chart, _dispatch, "on");

    return chart;
};