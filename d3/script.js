var width = parseInt(d3.select("body").style("width").slice(0, -2)),
    height = $(window).height() - 20,
    padding = 20;


var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

var projection = d3.geo.albersUsa()
    .scale(1200)
    .translate([ width/ 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

//Set up the queue so that all the stuff shows up at the same time. Also, the code is cleaner
queue()
    .defer(d3.json,"us-10m.json")
    .defer(d3.csv,"marketData_small.csv")
    .await(ready);

//define the function that gets run when the data are loaded.
function ready(error, us, oldData){
    var g = svg.append("g");

    g.append("g")
          .attr("id", "states")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
          .attr("d", path)

    g.append("path")
      .datum(topojson.mesh(us, us.objects.states))
      .attr("id", "state-borders")
      .attr("d", path);


    //So geo.albersUsa does not work with data that is outside of the US,
    //Some of our data is. Therefor we need to get rid of it. ohh well.

    data = []
    for (var i = 0; i < oldData.length; i++){
        var d = oldData[i]
        if(projection([d.x, d.y]) != null){ //if the projection fails, drop that value
                data.push(d)
        }
    }

    svg.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr("cx", function(d){return projection([d.x,d.y])[0]  })
        .attr("cy", function(d){return projection([d.x,d.y])[1]  })
        .attr("r", 2)
        .attr("fill", "steelblue")
        .each(function(d){
            if (projection([d.x,d.y]) == null){
                console.log([d.x,d.y])
            }

            })
}
