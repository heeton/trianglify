// Trianglify. Needs d3js
function Trianglify(options) {
    if (typeof options == 'undefined') options = {};
    // defaults
    this.options = {
        cellsize: defaults(options.cellsize, 150), // zero not valid here
        bleed: defaults(options.cellsize, 150),
        cellpadding: defaults(options.cellpadding, 0.1*options.cellsize || 15),
        noiseIntensity: defaults(options.noiseIntensity, 0.3),
        x_gradient: options.x_gradient,
        y_gradient: options.y_gradient
    }
    function defaults(opt, def) {
        return (typeof opt !== 'undefined') ?  opt : def;
    }
}

Trianglify.prototype.generate = function(width, height) {
    return new Trianglify.Pattern(this.options, width, height);
}

Trianglify.Pattern = function(options, width, height) {
    this.options = options
    this.width = width;
    this.height = height;
    this.svg = this.generateSVG();

    var s = new XMLSerializer();
    this.svgString = s.serializeToString(this.svg);
    this.base64 = btoa(this.svgString);
    this.dataUri = 'data:image/svg+xml;base64,' + this.base64;
    this.dataUrl = 'url('+this.dataUri+')';
}

Trianglify.Pattern.prototype.append = function() {
    document.body.appendChild(this.svg);
}

Trianglify.Pattern.gradient_2d = function (x_gradient, y_gradient, width, height) {
    
    return function(x, y) {
        var color_x = d3.scale.linear()
            .range(x_gradient)
            .domain(d3.range(0, width, width/x_gradient.length)); //[-bleed, width+bleed]
        var color_y = d3.scale.linear()
            .range(y_gradient)
            .domain(d3.range(0, height, height/y_gradient.length)); //[-bleed, width+bleed]
        return d3.interpolateRgb(color_x(x), color_y(y))(0.5);
    }
}

Trianglify.Pattern.prototype.generateSVG = function () {
    var options = this.options;
    cellsX = Math.ceil((this.width+options.bleed*2)/options.cellsize),
    cellsY = Math.ceil((this.height+options.bleed*2)/options.cellsize),
    color = Trianglify.Pattern.gradient_2d(options.x_gradient, options.y_gradient, this.width, this.height);

    var vertices = d3.range(cellsX*cellsY).map(function(d) {
    // figure out which cell we are in
    var col = d % cellsX;
    var row = Math.floor(d / cellsX);
    var x = -options.bleed + col*options.cellsize + Math.random() * (options.cellsize - options.cellpadding*2) + options.cellpadding;
    var y = -options.bleed + row*options.cellsize + Math.random() * (options.cellsize - options.cellpadding*2) + options.cellpadding;
    // return [x*cellsize, y*cellsize];
    return [x, y]; // Populate the actual background with points
    });

    var elem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // elem.setAttribute("width", this.width+"px");
    // elem.setAttribute("height", this.height+"px");
    var svg = d3.select(elem);
    // var svg = d3.select("body").append("svg")
    svg.attr("width", this.width);
    svg.attr("height", this.height);
    svg.attr('xmlns', 'http://www.w3.org/2000/svg');
    var group = svg.append("g");


    if (options.noiseIntensity > 0.01) {
    var filter = svg.append("filter").attr("id", "noise");

    var noise = filter.append('feTurbulence').attr('type', 'fractalNoise').attr('in', 'fillPaint').attr('fill', '#F00').attr('baseFrequency', 0.7).attr('numOctaves', '10').attr('stitchTiles', 'stitch');
    var transfer = filter.append('feComponentTransfer');
    transfer.append('feFuncR').attr('type', 'linear').attr('slope', '2').attr('intercept', '-.5');
    transfer.append('feFuncG').attr('type', 'linear').attr('slope', '2').attr('intercept', '-.5');
    transfer.append('feFuncB').attr('type', 'linear').attr('slope', '2').attr('intercept', '-.5');
    filter.append('feColorMatrix').attr('type', 'matrix').attr('values', "0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0 0 0 1 0")
    var filterRect = svg.append("rect").attr("opacity", options.noiseIntensity).attr('width', '100%').attr('height', '100%').attr("filter", "url(#noise)");
    }
    var polys = d3.geom.delaunay(vertices);
    polys.forEach(function(d) {
        var x = (d[0][0] + d[1][0] + d[2][0])/3;
        var y = (d[0][1] + d[1][1] + d[2][1])/3;
        var c = color(x, y);
        group.append("path").attr("d", "M" + d.join("L") + "Z").attr({ fill: c, stroke: c});
    })
    return svg.node();
}
