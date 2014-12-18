(function() {
// Inspired by http://informationandvisualization.de/blog/box-plot
// --
// Modified to akumpf to turn the box-plot horizontal :)
// --
d3.hbox = function() {
  var width = 1,
      height = 1,
      duration = 0,
      domain = null,
      value = Number,
      whiskers = boxWhiskers,
      quartiles = boxQuartiles,
      tickFormat = null;

  // For each small multiple…
  function box(g) {
    g.each(function(d, i) {
      d = d.map(value).sort(d3.ascending);
      var g = d3.select(this),
          n = d.length,
          min = d[0],
          max = d[n - 1];

      // Compute quartiles. Must return exactly 3 elements.
      var quartileData = d.quartiles = quartiles(d);

      // Compute whiskers. Must return exactly 2 elements, or null.
      var whiskerIndices = whiskers && whiskers.call(this, d, i),
          whiskerData = whiskerIndices && whiskerIndices.map(function(i) { return d[i]; });

      // Compute outliers. If no whiskers are specified, all data are "outliers".
      // We compute the outliers as indices, so that we can join across transitions!
      var outlierIndices = whiskerIndices
          ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
          : d3.range(n);

      // Compute the new x-scale.
      var x1 = d3.scale.linear()
          .domain(domain && domain.call(this, d, i) || [min, max])
          .range([width, 0]);

      // Retrieve the old x-scale, if this is an update.
      var x0 = this.__chart__ || d3.scale.linear()
          .domain([0, Infinity])
          .range(x1.range());

      // Stash the new scale.
      this.__chart__ = x1;

      // Note: the box, median, and box tick elements are fixed in number,
      // so we only have to handle enter and update. In contrast, the outliers
      // and other elements are variable, so we need to exit them! Variable
      // elements also fade in and out.

      // Update center line: the vertical line spanning the whiskers.
      var center = g.selectAll("line.center")
          .data(whiskerData ? [whiskerData] : []);

      center.enter().insert("line", "rect")
          .attr("class", "center")
          .attr("x1", function(d) { return width - x0(d[0]); })
          .attr("y1", height / 2)
          .attr("x2", function(d) { return width - x0(d[1]); })
          .attr("y2", height / 2)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("x1", function(d) { return width - x1(d[0]); })
          .attr("x2", function(d) { return width - x1(d[1]); });

      center.transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("x1", function(d) { return width - x1(d[0]); })
          .attr("x2", function(d) { return width - x1(d[1]); });

      center.exit().transition()
          .duration(duration)
          .style("opacity", 1e-6)
          .attr("x1", function(d) { return width - x1(d[0]); })
          .attr("x2", function(d) { return width - x1(d[1]); })
          .remove();

      // Update innerquartile box.
      var box = g.selectAll("rect.box")
          .data([quartileData]);

      box.enter().append("rect")
          .attr("class", "box stddev")
          .attr("x", function(d) { return width - x0(d[0]); })
          .attr("y", 13)
          .attr("width", function(d) { return x0(d[0]) - x0(d[2]); })
          .attr("height", height-26)
        .transition()
          .duration(duration)
          .attr("x", function(d) { return width - x1(d[0]); })
          .attr("width", function(d) { return x1(d[0]) - x1(d[2]); });

      box.transition()
          .duration(duration)
          .attr("x", function(d) { return width - x1(d[0]); })
          .attr("width", function(d) { return x1(d[0]) - x1(d[2]); });

	      // Update mean dot.
	      var meanDot = g.selectAll("circle.meandot")
	          .data([quartileData]);

	      meanDot.enter().append("circle")
	        .attr("class", "meandot")
	        .attr("r", 4)
	        .attr("cx", function(d) { return width - x0(d[0]) + (x0(d[0]) - x0(d[2]))/2; })
	        .attr("cy", height / 2)
	        .style("opacity", 1e-6)
	      .transition()
	        .duration(duration)
	        .attr("cx", function(d) { return width - x1(d[0]) + (x1(d[0]) - x1(d[2]))/2; })
	        .style("opacity", 1);

	      meanDot.transition()
          .duration(duration)
          .attr("cx", function(d) { return width - x1(d[0]) + (x1(d[0]) - x1(d[2]))/2; })
          .style("opacity", 1);

      // Update median line.
      var medianLine = g.selectAll("line.median")
          .data([quartileData[1]]);

      medianLine.enter().append("line")
          .attr("class", "median")
          .attr("x1", function(d) { return width - x0(d); })
          .attr("y1", 9)
          .attr("x2", function(d) { return width - x0(d); })
          .attr("y2", height-9)
        .transition()
          .duration(duration)
          .attr("x1", function(d) { return width - x1(d); })
          .attr("x2", function(d) { return width - x1(d); });

      medianLine.transition()
          .duration(duration)
          .attr("x1", function(d) { return width - x1(d); })
          .attr("x2", function(d) { return width - x1(d); });

      // Update whiskers.
      var whisker = g.selectAll("line.whisker")
          .data(whiskerData || []);

      whisker.enter().insert("line", "circle, text")
          .attr("class", "whisker")
          .attr("x1", function(d) { return width - x0(d); })
          .attr("y1", 13)
          .attr("x2", function(d) { return width - x0(d); })
          .attr("y2", height-13)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("x1", function(d) { return width - x1(d); })
          .attr("x2", function(d) { return width - x1(d); })
          .style("opacity", 1);

      whisker.transition()
          .duration(duration)
          .attr("x1", function(d) { return width - x1(d); })
          .attr("x2", function(d) { return width - x1(d); })
          .style("opacity", 1);

      whisker.exit().transition()
          .duration(duration)
          .attr("x1", function(d) { return width - x1(d); })
          .attr("x2", function(d) { return width - x1(d); })
          .style("opacity", 1e-6)
          .remove();

      // Update outliers.
      var outlier = g.selectAll("circle.outlier")
          .data(outlierIndices, Number);

      outlier.enter().insert("circle", "text")
          .attr("class", "outlier")
          .attr("r", 5)
          .attr("cx", function(i) { return width - x0(d[i]); })
          .attr("cy", height / 2)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("cx", function(i) { return width - x1(d[i]); })
					.style("opacity", 1);

      outlier.transition()
          .duration(duration)
          .attr("cx", function(i) { return width - x1(d[i]); })
					//.attr("title", function(i){return "title";})
          .style("opacity", 1);

      outlier.exit().transition()
          .duration(duration)
          .attr("cx", function(i) { return width - x1(d[i]); })
          .style("opacity", 1e-6)
          .remove();

      // Compute the tick format.
      var format = tickFormat || x1.tickFormat(8);

      // Update box ticks.
      var boxTick = g.selectAll("text.box")
          .data(quartileData);

      boxTick.enter().append("text")
          .attr("class", "box")
          .attr("dy", function(d, i){return i & 1 ? 10 : -2})
          .attr("dx", 0)
          .attr("x", function(d) { return width - x0(d); })
          .attr("y", function(d, i){return i & 1 ? height-10 : 10})
					.attr("text-anchor", "middle") //function(d, i) { return i & 1 ? "start" : "end"; })
          .text(format)
        .transition()
          .duration(duration)
          .attr("x", function(d) { return width - x1(d); });

      boxTick.transition()
          .duration(duration)
          .text(format)
          .attr("x", function(d) { return width - x1(d); });

      // Update whisker ticks. These are handled separately from the box
      // ticks because they may or may not exist, and we want don't want
      // to join box ticks pre-transition with whisker ticks post-.
      var whiskerTick = g.selectAll("text.whisker")
          .data(whiskerData || []);

      whiskerTick.enter().append("text")
          .attr("class", "whisker")
          .attr("dy", 10)
          .attr("dx", 0)
          .attr("x", function(d) { return width - x0(d); })
          .attr("y", height-10)
					.attr("text-anchor", "middle")
          .text(format)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("x", function(d) { return width - x1(d); })
          .style("opacity", 1);

      whiskerTick.transition()
          .duration(duration)
          .text(format)
          .attr("x", function(d) { return width - x1(d); })
          .style("opacity", 1);

      whiskerTick.exit().transition()
          .duration(duration)
          .attr("x", function(d) { return width - x1(d); })
          .style("opacity", 1e-6)
          .remove();
    });
    d3.timer.flush();
  }

  box.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return box;
  };

  box.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return box;
  };

  box.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return box;
  };

  box.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return box;
  };

  box.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x == null ? x : d3.functor(x);
    return box;
  };

  box.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return box;
  };

  box.whiskers = function(x) {
    if (!arguments.length) return whiskers;
    whiskers = x;
    return box;
  };

  box.quartiles = function(x) {
    if (!arguments.length) return quartiles;
    quartiles = x;
    return box;
  };

  return box;
};

function boxWhiskers(d) {
  return [0, d.length - 1];
}

function boxQuartiles(d) {
	if(!d || d.length < 3) console.log("hboxplot warning: not enough data.");
  return [
    d3.quantile(d, .25),
    d3.quantile(d, .5),
    d3.quantile(d, .75)
  ];
}

})();