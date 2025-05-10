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
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

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
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", "#ccc");

    
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
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

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
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.fatal))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", "#ccc"); 

    
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
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

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
    
    // Bars (vertical)
    svg.selectAll("rect")
        .data(percentageData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.activity))
        .attr("y", d => y(d.percentage)) // Begin bovenaan
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.percentage)) // Hoogte = percentage
        .attr("fill", "#ccc"); 

    
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