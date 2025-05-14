export function createTypeBarChart(data, countryName) {
        
    // Only proceed if we have data
    if (!data || data.length === 0) {
        d3.select('#barchart-container-type')
            .append("p")
            .text("No attack type data available");
        return;
    }

    // Bereken totaal aantal aanvallen voor percentages
    const totalAttacks = d3.sum(data, d => d.count);
    const percentageData = data.map(d => ({
        type: d.type,
        percentage: (d.count / totalAttacks) * 100 // Omzetten naar %
    }));

    // Margins and dimensions (you can adjust these)
    const margin = { top: 40, right: 60, bottom: 70, left: 100 };
    const width = window.innerWidth*0.2 - margin.left - margin.right;
    const height = window.innerHeight*0.3 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#barchart-container-type')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis (attack types)
    const x = d3.scaleBand()
        .range([0, width])
        .domain(percentageData.map(d => d.type))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis (percentages)
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 100]); // 0-100%

    svg.append("g")
        .call(d3.axisLeft(y)
            .tickValues([0, 20, 40, 60, 80, 100])
            .tickFormat(d => `${d}%`) // Toon percentages
        );

    // Find the maximum value in your data
    const maxValue = d3.max(percentageData, d => d.percentage);
    console.log(percentageData);
    console.log(maxValue);

    // Create color scale
    const colorScale = d => d.percentage === maxValue ? "#0000ff" : "#ccc";
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", d => colorScale(d));

    
    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Attack Types");
}

export function createFatalityBarChart(data, countryName) {
        
    // Only proceed if we have data
    if (!data || data.length === 0) {
        d3.select('#barchart-container-fatal_y_n')
            .append("p")
            .text("No fatality data available");
        return;
    }

    // Bereken totaal aantal aanvallen voor percentages
    const totalAttacks = d3.sum(data, d => d.count);
    const percentageData = data.map(d => ({
        fatal: d.fatal_y_n,
        percentage: (d.count / totalAttacks) * 100 // Omzetten naar %
    }));

    // Margins and dimensions (you can adjust these)
    const margin = { top: 40, right: 60, bottom: 70, left: 100 };
    const width = window.innerWidth*0.2 - margin.left - margin.right;
    const height = window.innerHeight*0.3 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#barchart-container-fatal_y_n')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis (fatal yes/no)
    const x = d3.scaleBand()
        .range([0, width])
        .domain(percentageData.map(d => d.fatal))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis (percentages)
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 100]); // 0-100%

    svg.append("g")
        .call(d3.axisLeft(y)
            .tickValues([0, 20, 40, 60, 80, 100])
            .tickFormat(d => `${d}%`) // Toon percentages
        );
    
    // Find the maximum value in your data
    const maxValue = d3.max(percentageData, d => d.percentage);
    console.log(percentageData);
    console.log(maxValue);

    // Create color scale
    const colorScale = d => d.percentage === maxValue ? "#0000ff" : "#ccc";
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.fatal))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", d => colorScale(d)); 

    
    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Fatality Rate of Attacks");
}

export function createActivityBarChart(data, countryName) {

    // Only proceed if we have data
    if (!data || data.length === 0) {
        d3.select('#barchart-container-activity')
            .append("p")
            .text("No activity data available");
        return;
    }

    // Bereken totaal aantal aanvallen voor percentages
    const totalAttacks = d3.sum(data, d => d.count);
    const percentageData = data.map(d => ({
        activity: d.general_activity,
        percentage: (d.count / totalAttacks) * 100 // Omzetten naar %
    }));

    // Margins and dimensions (you can adjust these)
    const margin = { top: 40, right: 60, bottom: 70, left: 100 };
    const width = window.innerWidth*0.2 - margin.left - margin.right;
    const height = window.innerHeight*0.3 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#barchart-container-activity')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(percentageData.map(d => d.activity))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis (percentages)
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 100]); // 0-100%

    svg.append("g")
        .call(d3.axisLeft(y)
            .tickValues([0, 20, 40, 60, 80, 100])
            .tickFormat(d => `${d}%`) // Toon percentages
        );
    
    // Find the maximum value in your data
    const maxValue = d3.max(percentageData, d => d.percentage);
    console.log(percentageData);
    console.log(maxValue);

    // Create color scale
    const colorScale = d => d.percentage === maxValue ? "#0000ff" : "#ccc";
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.activity))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", d => colorScale(d)); 

    
    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Activity of victim");
}

export function createAreaBarChart(data, countryName) {
        
    // Only proceed if we have data
    if (!data || data.length === 0) {
        d3.select('#barchart-container-area')
            .append("p")
            .text("No area data available");
        return;
    }

    // Bereken totaal aantal aanvallen voor percentages
    const totalAttacks = d3.sum(data, d => d.count);
    const percentageData = data.map(d => ({
        area: d.area,
        percentage: (d.count / totalAttacks) * 100 // Omzetten naar %
    }));

    // Margins and dimensions (you can adjust these)
    const margin = { top: 40, right: 60, bottom: 70, left: 100 };
    const width = 350 - margin.left - margin.right;
    const numberOfAreas = new Set(data.map(d => d.area)).size;
    const height = numberOfAreas*30;
    //const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#barchart-container-area')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y-axis (areas)
    const y = d3.scaleBand()
        .range([height, 0])
        .domain(percentageData.map(d => d.area))
        .padding(0.2);

        svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("transform", "rotate(-45)")

    // X-axis (percentages)
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, 100]); // 0-100%

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues([0, 20, 40, 60, 80, 100])
            .tickFormat(d => `${d}%`) // Show percentages
        );
    
    
    // Bars (horizontal)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("y", d => y(d.area))
        .attr("x", 0) // Start from left
        .attr("width", d => x(d.percentage)) // Width = percentage
        .attr("height", y.bandwidth())
        .attr("fill", "#ccc"); 

    
    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Specific location of attack");
}


export function createStackedBarChart(data, countryName) {

    if (!data || data.length === 0) {
        d3.select('#barchart-container-stacked')
            .append("p")
            .text("No activity data available");
        return;
    }

    const margin = { top: 40, right: 160, bottom: 70, left: 100 };
    const width = window.innerWidth * 0.45 - margin.left - margin.right;
    const height = window.innerHeight * 0.5 - margin.top - margin.bottom;

    const svg = d3.select('#barchart-container-stacked')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.activity))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 100]);


    svg.append("g")
        .call(d3.axisLeft(y)
            .tickValues([0, 20, 40, 60, 80, 100])
            .tickFormat(d => `${d}%`)
        );

    // Get unique types from the data
    const allTypes = Array.from(new Set(
        data.flatMap(d => d.types.map(t => t.type))
    ));

    const color = d3.scaleOrdinal()
        .domain(allTypes)
        .range(d3.schemeCategory10);

    /* const stack = d3.stack()
        .keys(allTypes)
        .value((d, key) => {
            const match = d.types.find(t => t.type === key);
            return match ? match.percentage : 0;
        }); */
    
    const stack = d3.stack()
        .keys(allTypes)
        .value((d, key) => {
            const match = d.types.find(t => t.type === key);
            return match ? match.percentage : 0;
        });

    const stackedData = stack(data);

    svg.selectAll("g.layer")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.activity))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`Activity of Victim in ${countryName}`);

    // Legend
    const legend = svg.selectAll(".legend")
        .data(allTypes)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
}

export function createLineGraph(data) {

    if (!data || data.length === 0) {
        d3.select('#linechart-container')
            .append("p")
            .text("No yearly data available");
        return;
    }

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = window.innerWidth * 0.45 - margin.left - margin.right;
    const height = window.innerHeight * 0.5 - margin.top - margin.bottom;

    const svg = d3.select('#linechart-container')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip setup
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "6px 10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Parse the year as integer
    data.forEach(d => {
        d.year = +d.year;
        d.count = +d.count;
    });

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.count));

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#007acc")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add dots
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", "#007acc")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Attacks:</strong> ${d.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Number of Shark Attacks per Year");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Number of Attacks");
}

