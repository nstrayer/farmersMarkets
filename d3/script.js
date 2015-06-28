d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var width = parseInt(d3.select("#viz").style("width").slice(0, -2)),
    mWidth = parseInt(d3.select("#menu").style("width").slice(0, -2)),
    height = $(window).height() - 85,
    padding = 20,
    selectColor = "#ff7f00"
    defaultColor = "#377eb8";

console.log(mWidth)
console.log(width)

var menu = d3.select("#menu").append("svg")
    .attr("width", mWidth)
    .attr("height", height)

var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

var projection = d3.geo.albersUsa()
    // .scale(1200)
    .scale(width)
    .translate([ width/ 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        g.selectAll("circle")
            .attr("d", path.projection(projection))
            .attr("r", 2/zoom.scale());
        g.selectAll("path")
            .attr("d", path.projection(projection));
    });

var g = svg.append("g").call(zoom);

//Set up the queue so that all the stuff shows up at the same time. Also, the code is cleaner
queue()
    .defer(d3.json,"us-10m.json")
    .defer(d3.csv,"marketData_small.csv")
    .await(ready);

//define the function that gets run when the data are loaded.
function ready(error, us, oldData){


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
        //if the projection fails, drop that value
        if(projection([d.x, d.y]) != null){ data.push(d) }
    }

    //we want to get the types of products offered as an array for the construction of the menu
    var types = Object.keys(data[0])
    types = types.slice(6, types.length)

    //code to test the classGenerator function. It works!
    // var test = classGenerator(data[1], types)
    // console.log(test)

    var menuXScale = d3.scale.ordinal()
        .domain([0, 1, 2, 3])
        .rangeRoundPoints([padding*4, mWidth - padding*4]);

    var menuYScale = d3.scale.linear()
        .domain([0, 4])
        .range([height/5, 4*(height/5)])

    g.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr("class", function(d){return classGenerator(d, types)})
        .attr("cx", function(d){return projection([d.x,d.y])[0]  })
        .attr("cy", function(d){return projection([d.x,d.y])[1]  })
        .attr("r", 2)
        .attr("fill", defaultColor)
        .attr("fill-opacity", "0.75")

    //Let's make the menu.

    var selected = []

    menu.selectAll("text")
        .data(types).enter()
        .append("text")
        .attr("x", function(d,i){return menuXScale(getCol(i))})
        .attr("y", function(d,i){return menuYScale(getRow(i))})
        .text(function(d){return d})
        .attr("font-family", "optima")
        .attr("font-size", "15px")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .on("click", function(d){
            //if the type hasn't already been selected
            if ($.inArray(d, selected) == -1){
                selected.push(d)
                d3.select(this)
                    .classed("selected", true)
                    .attr("font-size", "20")
                    .style("fill", selectColor)
                    .call(function(d){ highlighter(selected)})
            } else {
                //remove from the selected list:
                var index = selected.indexOf(d)
                selected.splice(index, 1)
                //return to default format.
                d3.select(this)
                    .attr("font-size", "15px")
                    .style("fill", "white")
                    .call(function(d){ highlighter(selected)})
            }
            // highlighter(selected)
        })
}

//Here is where we keep the functions.

function classGenerator(d, types){
    //take a data object and return a string for the class designation.
    //if a market has an object, include a class for that object.
    //e.g. if the market has just meat and vegetables, return "mean vegetables".
    var classString = ["market"]
    for (var i = 0; i < types.length; i++){
        type = types[i]

        //add the type if it is included
        if (d[type] == "Y"){ classString.push(type)}
    }
    //convert array of strings to one big string
    return classString.join(' ')
}

function getRow(i){
    //function to get row in menu
    return i%5
}

function getCol(i){
    //Function to get column in menu
    //i indexes at 0, goes up to 19 in this case.
    return Math.floor(i/5)
}

//lets make the function that highlights markets with the selected combination of traits!

function highlighter(selected){
    //return all circles to default
    d3.selectAll(".market")
        .attr("fill", defaultColor)
        .attr("fill-opacity", "0.75")

    //if there is anything selected, highlight it.
    if(selected.length != 0){
        //converted the selected list to a css selector string.
        var selector = "." + selected.join('.')
        d3.selectAll(selector)
            .attr("fill", selectColor)
            // .attr("r", 4)
            .attr("fill-opacity", "1")
            .moveToFront()
    }

}
