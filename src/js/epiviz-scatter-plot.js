epiviz_scatter = function() {

    // containers
    var _container,
        _svg,
        _legend,
        _axis,
        _chartContent,

        // data
        _origData,
        _data,
        _xKey = "x", //x value to plot
        _yKey = "y", //y value to plot
        _key = "key", //key to combine x and y

        // chart attributes
        _width = 400, //default value
        _height = 400, //default value
        _xScale,
        _yScale,
        _xAxis,
        _yAxis,
        _circleRadius = 4,
        _margins = { top: 50, right: 20, bottom: 20, left: 50 },

        // events
        _dispatch = d3.dispatch("hover", "click"),

        //tooltip
        _enableTooltip = true;

    function _drawAxis() {

        var cWidth = _width - _margins.left - _margins.right;
        var cHeight = _height - _margins.top - _margins.bottom;

        _xScale = d3.scale.linear().domain(
                d3.extent(_data, function(d) {
                    return d[_xKey];
                })
            )
            .range([0, cWidth])
            .nice();

        _yScale = d3.scale.linear().domain(
                d3.extent(_data, function(d) {
                    return d[_yKey];
                })
            )
            .range([cHeight, 0])
            .nice();

        _xAxis = d3.svg.axis().scale(_xScale).orient("bottom");
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

        _yAxis = d3.svg.axis().scale(_yScale).orient("left");
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


        // TODO: draw Grid Line

    }

    function _drawLegend() {
        //placeholder for legend
    }

    function _draw() {

        var selection = _chartContent.selectAll("circle")
            .data(_data);

        selection.enter().append("circle")
            .attr("class", "unhovered")
            .attr("cx", function(d) {
                return _xScale(d[_xKey]);
            })
            .attr("cy", function(d) {
                return _yScale(d[_yKey]);
            })
            .attr("r", _circleRadius)
            .on("mouseover", _mouseover)
            .on("mouseout", _mouseout);
    }

    function _mouseover(d, i) {
        var circle = d3.select(this);
        circle.attr("class", "hovered");
        _dispatch.hover([d]);
    }

    function _mouseout(d, i) {
        var circle = d3.select(this);
        circle.attr("class", "unhovered");
        _dispatch.hover([]);
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

        grouped.forEach(function(k1) {
            var tempObj = {};
            tempObj[_xKey] = k1.key;
            k1.values.forEach(function(k2) {
                tempObj[_yKey] = k2.key;
                var tempVals = [];
                k2.values.forEach(function(val) {
                    delete val[_xKey];
                    delete val[_yKey];
                });
                tempObj.group = k2.values;
            });
            gData.push(tempObj);
        });

        return gData;
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

    // TODO also be able to send dataX and dataY
    chart.create = function(container, data) {

        _container = d3.select(container);
        _origData = data;

        // Add svg element
        _svg = _container
            .append('svg')
            .attr("width", _width)
            .attr("height", _height)
            .append("g")
            .attr("transform", "translate(" + (_margins.left) + "," + (_margins.top) + ")");

        var chartLegend = _svg.append('g')
            .attr("class", "chart-legend");

        // Legend
        _legend = chartLegend.append('g')
            .attr("class", "legend");

        //Axis
        _axis = chartLegend.append('g')
            .attr("class", "axis")
            .attr("transform", "translate(20,-20)");

        //Actual Chart Data
        _chartContent = _svg.append('g')
            .attr("class", "chart-content")
            .attr("transform", "translate(20,-20)");

        // TODO: use service worker/ web workers. 
        // merge data points if they are close to each other
        _data = _collapseData(_origData);

        return chart;
    }

    chart.draw = function() {
        _drawAxis();
        _drawLegend();
        _draw();
    }

    d3.rebind(chart, _dispatch, "on");

    return chart;
};