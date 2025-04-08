const width = 900;
const height = 600;

const svg = d3.select('body').append('svg').attr('width', width).attr('height', height);

const projection = d3.geoMercator().scale(140).translate([width/2, height*2/3]);
const path = d3.geoPath(projection);

const g = svg.append('g');

// Maak een div voor de informatie rechts
const infoDiv = d3.select('body').append('div')
  .attr('class', 'info-panel')
  .style('position', 'absolute')
  .style('left', '60%')
  .style('top', '20px')
  .style('width', '400px')
  .style('padding', '10px')
  .style('background', '#f0f0f0')
  .style('border', '1px solid #ccc');

Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
    //d3.csv('global_shark_attacks.csv')
    d3.csv('NewSharkCSV.csv')
]).then(([mapData, sharkData]) => {

    const formatCountryName = (name) => {
        if (!name) return '';
        
        // usa moet United Stated of America worden
        const specialCases = {
          'usa': 'United States of America',
        };
        
        const lowerName = name.toLowerCase();
        if (specialCases[lowerName]) {
          return specialCases[lowerName];
        }
        
        // Title Case toepassen op andere landnamen
        return lowerName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      
    const attackCountries = sharkData.map(d => formatCountryName(d.country));

    const attacksByCountry = {};
    attackCountries.forEach(country => {
        if (country) {
            attacksByCountry[country] = (attacksByCountry[country] || 0) + 1;
        }
    });

    const countries = topojson.feature(mapData, mapData.objects.countries);
    
    // Bewaar de oorspronkelijke data voor reset
    let originalData = countries.features;
    
    // Maak landen aan
    const countryPaths = g.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
            const countryName = d.properties.name;
            return attacksByCountry[countryName] ? '#ff0000' : '#ccc';
        })
        .on('mouseover', function(event, d) {
            const countryName = d.properties.name;
            const attackCount = attacksByCountry[countryName] || 0;
            
            svg.append('text')
                .attr('class', 'country-label')
                .attr('x', '50%')
                .attr('text-anchor', 'middle')
                .attr('y', '90%')
                .text(`${countryName}: ${attackCount} Attacks`);
        })
        .on('mouseout', function() {
            d3.selectAll('.country-label').remove();
        })
        .on('click', function(event, clickedCountry) {
            // Verwijder alle landen behalve het aangeklikte
            countryPaths.filter(d => d !== clickedCountry).remove();
            
            // Pas de projectie aan om het geselecteerde land naar links te verplaatsen
            const newProjection = d3.geoMercator()
                .scale(140)
                .translate([width/4, height*2/3]) // Verplaats naar links (1/4 in plaats van 1/2)
                .fitSize([width/2, height/2], {type: "FeatureCollection", features: [clickedCountry]});
            
            // Update het pad van het overgebleven land
            d3.select(this)
                .attr('d', d3.geoPath().projection(newProjection));
            
            // Toon informatie over het land
            const countryName = clickedCountry.properties.name;
            const attackCount = attacksByCountry[countryName] || 0;

            const countryData = sharkData.filter(d => 
                d.country.toLowerCase() === countryName.toLowerCase() // moet mss nog aangepast worden
            );

            const attackTypes = {};
            countryData.forEach(d => {
                const type = d.type || 'Unknown';
                attackTypes[type] = (attackTypes[type] || 0) + 1;
            });

            // Convert to array for D3
            const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                type,
                count
            })).sort((a, b) => b.count - a.count);
    
            // Create bar chart
            createBarChart(typeData, countryName);
            
            infoDiv.html(`
                <h2>${countryName}</h2>
                <p>Total shark attacks: ${attackCount}</p>
                <button id="reset-btn">Reset Map</button>
            `);
            
            // Voeg event listener toe voor reset knop
            d3.select('#reset-btn').on('click', function() {
                resetMap();
            });
        });
        
    // Functie om de kaart te resetten
    function resetMap() {
        // Verwijder alle landen
        g.selectAll('.country').remove();
        
        // Voeg alle landen opnieuw toe
        g.selectAll('path')
            .data(originalData)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => {
                const countryName = d.properties.name;
                return attacksByCountry[countryName] ? '#ff0000' : '#ccc';
            })
            .on('mouseover', function(event, d) {
                const countryName = d.properties.name;
                const attackCount = attacksByCountry[countryName] || 0;
                
                svg.append('text')
                    .attr('class', 'country-label')
                    .attr('x', '50%')
                    .attr('text-anchor', 'middle')
                    .attr('y', '90%')
                    .text(`${countryName}: ${attackCount} Attacks`);
            })
            .on('mouseout', function() {
                d3.selectAll('.country-label').remove();
            })
            .on('click', function(event, clickedCountry) {
                // Verwijder alle landen behalve het aangeklikte
                g.selectAll('.country').filter(d => d !== clickedCountry).remove();
                
                // Pas de projectie aan
                const newProjection = d3.geoMercator()
                    .scale(140)
                    .translate([width/4, height*2/3])
                    .fitSize([width/2, height/2], {type: "FeatureCollection", features: [clickedCountry]});
                
                // Update het pad van het overgebleven land
                d3.select(this)
                    .attr('d', d3.geoPath().projection(newProjection));
                
                // Toon informatie
                const countryName = clickedCountry.properties.name;
                const attackCount = attacksByCountry[countryName] || 0;

                const countryData = sharkData.filter(d => 
                    d.country.toLowerCase() === countryName.toLowerCase() // moet mss nog aangepast worden
                );

                const attackTypes = {};
                countryData.forEach(d => {
                    const type = d.type || 'Unknown';
                    attackTypes[type] = (attackTypes[type] || 0) + 1;
                });

                // Convert to array for D3
                const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                    type,
                    count
                })).sort((a, b) => b.count - a.count);

                // Create bar chart
                createBarChart(typeData, countryName);
                
                infoDiv.html(`
                    <h2>${countryName}</h2>
                    <p>Total shark attacks: ${attackCount}</p>
                    <button id="reset-btn">Reset Map</button>
                `);
                
                d3.select('#reset-btn').on('click', function() {
                    resetMap();
                });
            });
            
        // Verwijder de bar chart en maak info panel leeg
        d3.select("#barchart-container svg").remove();
        d3.select("#barchart-container p").remove();
        infoDiv.html('');
    }

    // Function to create bar chart
    function createBarChart(data, countryName) {
        
        // Only proceed if we have data
        if (!data || data.length === 0) {
            d3.select("#barchart-container")
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
        const svg = d3.select("#barchart-container")
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
        .attr("fill", "#69b3a2");

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(`Attack Types in ${countryName} (%)`);
    }
});