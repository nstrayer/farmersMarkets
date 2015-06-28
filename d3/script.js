var width = parseInt(d3.select("body").style("width").slice(0, -2)),
    height = $(window).height() - 20,
    padding = 20;


var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

var projection = d3.geo.albersUsa()
    .scale(1200)
    .translate([ width/ 1.6, height / 2]);

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
        .rangeRoundPoints([padding*4, width/4.5]);

    var menuYScale = d3.scale.linear()
        .domain([0, 4])
        .range([padding*3, height - padding*3])

    svg.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr("class", function(d){return classGenerator(d, types)})
        .attr("cx", function(d){return projection([d.x,d.y])[0]  })
        .attr("cy", function(d){return projection([d.x,d.y])[1]  })
        .attr("r", 2)
        .attr("fill", "steelblue")

    //Let's make the menu.

    var selected = []

    svg.selectAll("text")
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
            d3.select(this)
                .attr("font-size", "20")
                .style("fill", "blue")
            if ($.inArray(d, selected) == -1){
                selected.push(d)
            }
            console.log(selected)
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
