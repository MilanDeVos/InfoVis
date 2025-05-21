import * as charts from './charts.js';

const width = window.innerWidth * 0.8; 
const height = width * 0.6 ; 

const svg = d3.select('body').append('svg').attr('width', width).attr('height', height*0.8);

const projection = d3.geoMercator().scale(width/12).translate([width/2, height/2.5]);
const path = d3.geoPath(projection);

const g = svg.append('g');

// 2. Add clipPath
svg.append("defs").append("clipPath")
    .attr("id", "clip-bottom")
    .append("rect")
    .attr("width", width)
    .attr("height", height * 0.65) // Show 90% of height
    .attr("y", 0);

g.attr("clip-path", "url(#clip-bottom)");

// Maak een div voor de informatie rechts
const infoDiv = d3.select('body').append('div')
  .attr('class', 'info-panel')
  .style('position', 'absolute')
  .style('left', '70%')
  .style('top', '20px')
  .style('width', '400px');

const beginInfo = `
    <div class="country-info">
        <h2>Should we be scared of shark attacks?</h2>
        <ul class="stat-list">
            <li>Shark attacks are extremely rare and often accidental</li>
            <li>Sharks usually mistake humans for prey (like seals), especially in murky water</li>
            <li>Yearly statistics:
                <ul>
                    <li>~100 shark attacks worldwide (mostly non-fatal)</li>
                    <li>>1 million car accident deaths</li>
                    <li>>320,000 drowning deaths</li>
                </ul>
            </li>
            <li>Movies and TV portrayals of sharks intentionally hunting humans are misleading</li>
        </ul>
        <h3>Our Approach:</h3>
        <ul>
            <li>We provide data-driven insights on ocean risks</li>
            <li>Help distinguish real vs. perceived dangers</li>
            <li>Empower safer, more enjoyable ocean experiences</li>
            <li>Highlight which activities need caution vs. which are generally safe</li>
        </ul>
    </div>
    `;
infoDiv.html(beginInfo)

Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
    //d3.csv('global_shark_attacks.csv')
    //d3.csv('NewSharkCSV.csv')
    //d3.csv('Updated_Countries.csv')
    d3.csv('cleaned_shark_data.csv')
]).then(([mapData, sharkData]) => {

    const formatCountryName = (name) => {
        if (!name) return '';
        
        // united states of america moet United Stated of America worden
        const specialCases = {
          'united states of america': 'United States of America',
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

    // average attacks in the last 10 years (2014-2023)
    const sharkDataFiltered = sharkData.filter(d => {
        const year = +d.year;
        return year >= 2014 && year <= 2023;
    });

    // Calculate total and average attacks by country in the last 10 years (2014-2023)
    const attacksByCountry10Years = {};
    const avgAttacksByCountry = {};
    
    sharkDataFiltered.forEach(d => {
        const country = formatCountryName(d.country);
        if (country) {
            attacksByCountry10Years[country] = (attacksByCountry10Years[country] || 0) + 1;
        }
    });
    
    // Calculate averages (total attacks / number of years)
    Object.keys(attacksByCountry10Years).forEach(country => {
        if (attacksByCountry10Years[country] === 0) {
            avgAttacksByCountry[country] = 0;
        } else {
            avgAttacksByCountry[country] = attacksByCountry10Years[country] / 10;
        }
    });

    const maxAttacks = d3.max(Object.values(attacksByCountry)) || 1;
    const colorScale = d3.scaleLog()
        .domain([1, maxAttacks])
        //.range(["#ffcccc", "#cc0000"]); // licht naar donkerrood
        .range(["#ffe6e6", "#cc0000"]); // licht naar donkerrood

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
            const attackCount = attacksByCountry[countryName] || 0;
            if (attackCount <= 0) return '#ccc';
            return colorScale(attackCount);
        })
        .on('mouseover', function(event, d) {
            const countryName = d.properties.name;
            const attackCount = attacksByCountry[countryName] || 0;
            const avgAttacks = avgAttacksByCountry[countryName] || 0;
            
            svg.append('text')
                .attr('class', 'country-label')
                .attr('x', '50%')
                .attr('text-anchor', 'middle')
                .attr('y', '85%')
                .text(`${countryName}: ${attackCount} total attacks since 1900 (${avgAttacks.toFixed(1)} attacks/year 2014-2023)`);
        })
        .on('mouseout', function() {
            d3.selectAll('.country-label').remove();
        })
        .on('click', function(event, clickedCountry) {
            d3.selectAll('.country-label').remove();
            // Check if a country is already selected
            if (d3.select('.country-selected').size() > 0) {
                return; // Exit if a country is already selected
            }
            
            // Mark this country as selected
            d3.select(this).classed('country-selected', true);

            const countryName = clickedCountry.properties.name;

            // on click USA create different map
            if (countryName === 'United States of America') {
                // Load US states data
                Promise.all([
                    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'), // Map van USA
                    d3.csv('cleaned_shark_data.csv')
                ]).then(([usData, sharkData]) => {
                    // Remove all countries
                    g.selectAll('.country').remove();
                    
                    // Create Albers USA projection
                    const usProjection = d3.geoAlbersUsa()
                        .translate([width/2, height/4])
                        .scale(width/2);
                        
                    const usPath = d3.geoPath(usProjection);
                    
                    // Convert TopoJSON to GeoJSON
                    const states = topojson.feature(usData, usData.objects.states);
                    
                    // Filter shark data for USA
                    const usSharkData = sharkData.filter(d => 
                        formatCountryName(d.country) === 'United States of America'
                    );

                    // Count attacks by state
                    const attacksByState = {};
                    usSharkData.forEach(d => {
                        const state = d.area;
                        if (state) {
                            attacksByState[state] = (attacksByState[state] || 0) + 1;
                        }
                    });

                    // average attacks in the last 10 years (2014-2023)
                    const usSharkDataFiltered = usSharkData.filter(d => {
                        const year = +d.year;
                        return year >= 2014 && year <= 2023;
                    });

                    // Calculate total and average attacks by country in the last 10 years (2014-2023)
                    const attacksByState10Years = {};
                    const avgAttacksByState = {};
                    
                    usSharkDataFiltered.forEach(d => {
                        const state = d.area;
                        if (state) {
                            attacksByState10Years[state] = (attacksByState10Years[state] || 0) + 1;
                        }
                    });
                    
                    // Calculate averages (total attacks / number of years)
                    Object.keys(attacksByState10Years).forEach(state => {
                        avgAttacksByState[state] = attacksByState10Years[state] / 10;
                    });

                    const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                    const stateColorScale = d3.scaleLog()
                        .domain([1, maxStateAttacks])
                        .range(["#ffcccc", "#cc0000"]);
                        //.range(["#ffe6e6", "#cc0000"]);
                    
                    // Draw US states
                    g.selectAll('.state')
                        .data(states.features)
                        .enter()
                        .append('path')
                        .attr('class', 'state')
                        .attr('d', usPath)
                        .attr('fill', d => {
                            const stateName = d.properties.name;
                            const attackCount = attacksByState[stateName] || 0;
                            if (attackCount <= 0) return '#ccc';
                            return stateColorScale(attackCount);
                        })
                        .on('mouseover', function(event, d) {
                            const stateName = d.properties.name;
                            const attackCount = attacksByState[stateName] || 0;
                            const avgAttacks = avgAttacksByState[stateName] || 0;
                            
                            svg.append('text')
                                .attr('class', 'state-label')
                                .attr('x', '50%')
                                .attr('text-anchor', 'middle')
                                .attr('y', '65%')
                                .text(`${stateName}: ${attackCount} total attacks since 1900 (${avgAttacks} Attacks/year 2014-2023)`);
                        })
                        .on('mouseout', function() {
                            d3.selectAll('.state-label').remove();
                        });
                    
                        const stateData = sharkData.filter(d => 
                            d.country === "UNITED STATES OF AMERICA"
                        );

                    // ATTACK TYPES
                    const attackTypes = {};
                    stateData.forEach(d => {
                        const type = d.type || 'Unknown';
                        attackTypes[type] = (attackTypes[type] || 0) + 1;
                    });

                    // Convert to array for D3
                    const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                        type,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // ATTACK FATALITY
                    const attackfatality = {};
                    stateData.forEach(d => {
                        const fatal_y_n = d.fatal_y_n || 'Unknown';
                        attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                    });

                    // Convert to array for D3
                    const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                        fatal_y_n,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // VICTIMS ACTIVITY
                    const victimsActivity = {};
                    stateData.forEach(d => {
                        const general_activity = d.general_activity || 'Unknown';
                        victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                    });

                    // Convert to array for D3
                    const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                        general_activity,
                        count
                    })).sort((a, b) => b.count - a.count);

                    const TotalAttacks = attacksByCountry["United States of America"] || 0;

                    // stacked barchart data
                    const combinedData = activityData.map(activity => {
                        const activityTotal = activity.count;
                        const types = stateData
                            .filter(d => d.general_activity === activity.general_activity)
                            .reduce((acc, d) => {
                                const type = d.type || 'Unknown';
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                            }, {});

                        return {
                            activity: activity.general_activity,
                            totalPercentage: (activityTotal / TotalAttacks) * 100,
                            types: Object.entries(types).map(([type, count]) => ({
                                type,
                                count,
                                percentage: (count / TotalAttacks) * 100 // key change: scale to total, not activity
                            }))
                        };
                    });

                    //line chart year counts per year
                    const yearCounts = {};
                    let minYear = Infinity;
                    let maxYear = -Infinity;

                    stateData.forEach(entry => {
                        const year = parseInt(entry.year);
                        if (!isNaN(year)) {
                            yearCounts[year] = (yearCounts[year] || 0) + 1;
                            if (year < minYear) minYear = year;
                            if (year > maxYear) maxYear = year;
                        }
                    });

                    // Fill in all years from 1900 to 2024 with 0 if missing
                    const lineChartData = [];
                    //change years if dataset is bigger
                    for (let year = 1900; year <= 2023; year++) {
                        lineChartData.push({
                            year,
                            count: yearCounts[year] || 0
                        });
                    }

                    // Create bar charts
                    //charts.createTypeBarChart(typeData, "UNITED STATES OF AMERICA");
                    charts.createFatalityBarChart(fatalityData, "UNITED STATES OF AMERICA");
                    //charts.createActivityBarChart(activityData, "UNITED STATES OF AMERICA");
                    charts.createStackedBarChart(combinedData, "UNITED STATES OF AMERICA");
                    charts.createLineGraph(lineChartData);
                        
                    const avgAttacks = avgAttacksByCountry["United States of America"] || 0;

                    // Update info panel
                    infoDiv.html(`
                        <div class="country-info">
                            <h2 class="country-title">United States of America</h2>
                            <div class="info-stats">
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${TotalAttacks}</span>
                                    <span class="stat-label">Total shark attacks since 1900</span>
                                </p>
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${avgAttacks}</span>
                                    <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                                </p>
                            </div>
                            <button id="reset-btn" class="reset-button">
                                <i class="fas fa-sync-alt"></i> Back
                            </button>
                        </div>
                    `);
                    
                    // Reset button handler
                    d3.select('#reset-btn').on('click', resetMap);
                });

            } else if (countryName === 'Australia') {
                // Load Australia states data from specific GeoJSON
                Promise.all([
                    d3.json('aust.json'), // Map van Australie
                    d3.csv('cleaned_shark_data.csv')
                ]).then(([ausData, sharkData]) => {
                    // Remove all countries
                    g.selectAll('.country').remove();
                    
                    // Create projection specifically for Australia
                    const ausProjection = d3.geoMercator().scale(width/2).translate([-width/1.5, -height/8]);
                    
                    const ausPath = d3.geoPath(ausProjection);
                    
                    // Filter shark data for Australia
                    const ausSharkData = sharkData.filter(d => 
                        formatCountryName(d.country) === 'Australia'
                    );
                    
                    // Count attacks by state
                    const attacksByState = {};
                    ausSharkData.forEach(d => {
                        const state = d.area; 
                        if (state) {
                            attacksByState[state] = (attacksByState[state] || 0) + 1;
                        }
                    });

                    // average attacks in the last 10 years (2014-2023)
                    const ausSharkDataFiltered = ausSharkData.filter(d => {
                        const year = +d.year;
                        return year >= 2014 && year <= 2023;
                    });

                    // Calculate total and average attacks by country in the last 10 years (2014-2023)
                    const attacksByState10Years = {};
                    const avgAttacksByState = {};
                        
                    ausSharkDataFiltered.forEach(d => {
                        const state = d.area;
                        if (state) {
                            attacksByState10Years[state] = (attacksByState10Years[state] || 0) + 1;
                        }
                    });
                        
                    // Calculate averages (total attacks / number of years)
                    Object.keys(attacksByState10Years).forEach(state => {
                        avgAttacksByState[state] = attacksByState10Years[state] / 10;
                    });

                    const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                    const stateColorScale = d3.scaleLinear()
                        .domain([0, maxStateAttacks])
                        .range(["#ffcccc", "#cc0000"]);
                    
                    // Draw Australian states
                    g.selectAll('.state')
                        .data(ausData.features)
                        .enter()
                        .append('path')
                        .attr('class', 'state')
                        .attr('d', ausPath)
                        .attr('fill', d => {
                            const stateName = d.properties.STATE_NAME;
                            const attackCount = attacksByState[stateName] || 0;
                            if (attackCount <= 0) return '#ccc';
                            return stateColorScale(attackCount);
                        })
                        .on('mouseover', function(event, d) {
                            const stateName = d.properties.name || d.properties.STATE_NAME;
                            const attackCount = attacksByState[stateName] || 0;
                            const avgAttacks = avgAttacksByState[stateName] || 0;
                            
                            svg.append('text')
                                .attr('class', 'state-label')
                                .attr('x', '50%')
                                .attr('text-anchor', 'middle')
                                .attr('y', '65%')
                                .text(`${stateName}: ${attackCount} total attacks since 1900 (${avgAttacks} Attacks/year 2014-2023)`);
                        })
                        .on('mouseout', function() {
                            d3.selectAll('.state-label').remove();
                        })
                        .on('click', function(event, d) {
                            // Optional: Add click handler for individual states
                            const stateName = d.properties.name || d.properties.STATE_NAME;
                            // Show state-specific shark attack data
                        });
                        
                    const stateData = sharkData.filter(d => 
                        d.country === "AUSTRALIA"
                    );

                    // ATTACK TYPES
                    const attackTypes = {};
                    stateData.forEach(d => {
                        const type = d.type || 'Unknown';
                        attackTypes[type] = (attackTypes[type] || 0) + 1;
                    });

                    // Convert to array for D3
                    const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                        type,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // ATTACK FATALITY
                    const attackfatality = {};
                    stateData.forEach(d => {
                        const fatal_y_n = d.fatal_y_n || 'Unknown';
                        attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                    });

                    // Convert to array for D3
                    const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                        fatal_y_n,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // VICTIMS ACTIVITY
                    const victimsActivity = {};
                    stateData.forEach(d => {
                        const general_activity = d.general_activity || 'Unknown';
                        victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                    });

                    // Convert to array for D3
                    const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                        general_activity,
                        count
                    })).sort((a, b) => b.count - a.count);

                    const TotalAttacks = attacksByCountry["Australia"] || 0;

                    // stacked barchart data
                    const combinedData = activityData.map(activity => {
                        const activityTotal = activity.count;
                        const types = stateData
                            .filter(d => d.general_activity === activity.general_activity)
                            .reduce((acc, d) => {
                                const type = d.type || 'Unknown';
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                            }, {});

                        return {
                            activity: activity.general_activity,
                            totalPercentage: (activityTotal / TotalAttacks) * 100,
                            types: Object.entries(types).map(([type, count]) => ({
                                type,
                                count,
                                percentage: (count / TotalAttacks) * 100 // key change: scale to total, not activity
                            }))
                        };
                    });

                    //line chart year counts per year
                    const yearCounts = {};
                    let minYear = Infinity;
                    let maxYear = -Infinity;

                    stateData.forEach(entry => {
                        const year = parseInt(entry.year);
                        if (!isNaN(year)) {
                            yearCounts[year] = (yearCounts[year] || 0) + 1;
                            if (year < minYear) minYear = year;
                            if (year > maxYear) maxYear = year;
                        }
                    });

                    // Fill in all years from 1900 to 2024 with 0 if missing
                    const lineChartData = [];
                    //change years if dataset is bigger
                    for (let year = 1900; year <= 2023; year++) {
                        lineChartData.push({
                            year,
                            count: yearCounts[year] || 0
                        });
                    }

                    // Create bar chart
                    //charts.createTypeBarChart(typeData, "AUSTRALIA");
                    charts.createFatalityBarChart(fatalityData, "AUSTRALIA");
                    //charts.createActivityBarChart(activityData, "AUSTRALIA");
                    charts.createStackedBarChart(combinedData, "AUSTRALIA");
                    charts.createLineGraph(lineChartData);

                    const avgAttacks = avgAttacksByCountry["Australia"] || 0;

                    // Update info panel
                    infoDiv.html(`
                        <div class="country-info">
                            <h2 class="country-title">Australia</h2>
                            <div class="info-stats">
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${TotalAttacks}</span>
                                    <span class="stat-label">Total shark attacks since 1900</span>
                                </p>
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${avgAttacks}</span>
                                    <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                                </p>
                            </div>
                            <button id="reset-btn" class="reset-button">
                                <i class="fas fa-sync-alt"></i> Back
                            </button>
                        </div>
                    `);
                    
                    d3.select('#reset-btn').on('click', resetMap);
                });
            } else { // on click any other country just zoom
                const countryPaths = g.selectAll('path')
                .on('mouseover', function(event, d) {
                })
                .on('mouseout', function() {
                    d3.selectAll('.state-label').remove();
                });
                // Verwijder alle landen behalve het aangeklikte
                countryPaths.filter(d => d !== clickedCountry).remove();
                
                // Pas de projectie aan om het geselecteerde land naar links te verplaatsen
                const newProjection = d3.geoMercator()
                    .fitSize([width/1.2, height/2], {type: "FeatureCollection", features: [clickedCountry]});
                
                // Update het pad van het overgebleven land
                d3.select(this)
                    .attr('d', d3.geoPath().projection(newProjection));
                
                // Toon informatie over het land
                const countryName = clickedCountry.properties.name;
                const attackCount = attacksByCountry[countryName] || 0;

                const countryData = sharkData.filter(d => 
                    d.country.toLowerCase() === countryName.toLowerCase() // moet mss nog aangepast worden
                );

                // ATTACK TYPES
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

                // ATTACK FATALITY
                const attackfatality = {};
                countryData.forEach(d => {
                    const fatal_y_n = d.fatal_y_n || 'Unknown';
                    attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                });

                // Convert to array for D3
                const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                    fatal_y_n,
                    count
                })).sort((a, b) => b.count - a.count);

                // VICTIMS ACTIVITY
                const victimsActivity = {};
                countryData.forEach(d => {
                    const general_activity = d.general_activity || 'Unknown';
                    victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                });

                // Convert to array for D3
                const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                    general_activity,
                    count
                })).sort((a, b) => b.count - a.count);

                // AREA
                const attackArea = {};
                countryData.forEach(d => {
                    const area = d.area || 'Unknown';
                    attackArea[area] = (attackArea[area] || 0) + 1;
                });

                // Convert to array for D3
                const areaData = Object.entries(attackArea).map(([area, count]) => ({
                    area,
                    count
                })).sort((a, b) => b.count - a.count);

                const totalAttacks = activityData.reduce((sum, d) => sum + d.count, 0);

                // stacked barchart data
                const combinedData = activityData.map(activity => {
                    const activityTotal = activity.count;
                    const types = countryData
                        .filter(d => d.general_activity === activity.general_activity)
                        .reduce((acc, d) => {
                            const type = d.type || 'Unknown';
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                        }, {});

                    return {
                        activity: activity.general_activity,
                        totalPercentage: (activityTotal / totalAttacks) * 100,
                        types: Object.entries(types).map(([type, count]) => ({
                            type,
                            count,
                            percentage: (count / totalAttacks) * 100 // key change: scale to total, not activity
                        }))
                    };
                });

                //line chart year counts per year
                const yearCounts = {};
                let minYear = Infinity;
                let maxYear = -Infinity;

                countryData.forEach(entry => {
                    const year = parseInt(entry.year);
                    if (!isNaN(year)) {
                        yearCounts[year] = (yearCounts[year] || 0) + 1;
                        if (year < minYear) minYear = year;
                        if (year > maxYear) maxYear = year;
                    }
                });

                // Fill in all years from 1900 to 2024 with 0 if missing
                const lineChartData = [];
                //change years if dataset is bigger
                for (let year = 1900; year <= 2023; year++) {
                    lineChartData.push({
                        year,
                        count: yearCounts[year] || 0
                    });
                }

                // Create bar chart
                //charts.createTypeBarChart(typeData, countryName);
                charts.createFatalityBarChart(fatalityData, countryName);
                //charts.createActivityBarChart(activityData, countryName);
                charts.createStackedBarChart(combinedData, countryName);
                charts.createLineGraph(lineChartData);
                //console.log(combinedData);
                //charts.createAreaBarChart(areaData, countryName);

                const avgAttacks = avgAttacksByCountry[countryName] || 0;

                infoDiv.html(`
                    <div class="country-info">
                        <h2 class="country-title">${countryName}</h2>
                        <div class="info-stats">
                            <p class="stat-item">
                                <span class="stat-icon">🦈</span>
                                <span class="stat-value">${attackCount}</span>
                                <span class="stat-label">Total shark attacks since 1900</span>
                            </p>
                            <p class="stat-item">
                                <span class="stat-icon">🦈</span>
                                <span class="stat-value">${avgAttacks}</span>
                                <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                            </p>
                        </div>
                        <button id="reset-btn" class="reset-button">
                            <i class="fas fa-sync-alt"></i> Back
                        </button>
                    </div>
                `);
                
                // Voeg event listener toe voor reset knop
                d3.select('#reset-btn').on('click', function() {
                    resetMap();
                    // Remove the selected class when resetting
                    d3.select('.country-selected').classed('country-selected', false);
                });
            }
        });
        
    // Functie om de kaart te resetten
    function resetMap() {
        // Verwijder alle landen
        g.selectAll('*').remove();
        
        // Voeg alle landen opnieuw toe
        g.selectAll('path')
            .data(originalData)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => {
                const countryName = d.properties.name;
                const attackCount = attacksByCountry[countryName] || 0;
                return attackCount > 0 ? colorScale(attackCount) : '#ccc';
            })
            .on('mouseover', function(event, d) {
                const countryName = d.properties.name;
                const attackCount = attacksByCountry[countryName] || 0;
                const avgAttacks = avgAttacksByCountry[countryName] || 0;
                
                svg.append('text')
                    .attr('class', 'country-label')
                    .attr('x', '50%')
                    .attr('text-anchor', 'middle')
                    .attr('y', '85%')
                    //.text(`${countryName}: ${attackCount} Attacks`);
                    .text(`${countryName}: ${attackCount} total attacks since 1900 (${avgAttacks.toFixed(1)} attacks/year 2014-2023)`);
            })
            .on('mouseout', function() {
                d3.selectAll('.country-label').remove();
            })
            .on('click', function(event, clickedCountry) {
                d3.selectAll('.country-label').remove();
                // Check if a country is already selected
                if (d3.select('.country-selected').size() > 0) {
                    return; // Exit if a country is already selected
                }
                
                // Mark this country as selected
                d3.select(this).classed('country-selected', true);

                const countryName = clickedCountry.properties.name;

                if (countryName === 'United States of America') {
                    // Load US states data
                    Promise.all([
                        d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'),
                        d3.csv('cleaned_shark_data.csv')
                    ]).then(([usData, sharkData]) => {
                        // Remove all countries
                        g.selectAll('.country').remove();
                        
                        // Create Albers USA projection
                        const usProjection = d3.geoAlbersUsa()
                        .translate([width/2, height/4])
                        .scale(width/2);
                            
                        const usPath = d3.geoPath(usProjection);
                        
                        // Convert TopoJSON to GeoJSON
                        const states = topojson.feature(usData, usData.objects.states);
                        
                        // Filter shark data for USA
                        const usSharkData = sharkData.filter(d => 
                            formatCountryName(d.country) === 'United States of America'
                        );
                        
                        // Count attacks by state
                        const attacksByState = {};
                        usSharkData.forEach(d => {
                            const state = d.area;
                            if (state) {
                                attacksByState[state] = (attacksByState[state] || 0) + 1;
                            }
                        });

                        // average attacks in the last 10 years (2014-2023)
                        const usSharkDataFiltered = usSharkData.filter(d => {
                            const year = +d.year;
                            return year >= 2014 && year <= 2023;
                        });

                        // Calculate total and average attacks by country in the last 10 years (2014-2023)
                        const attacksByState10Years = {};
                        const avgAttacksByState = {};
                        
                        usSharkDataFiltered.forEach(d => {
                            const state = d.area;
                            if (state) {
                                attacksByState10Years[state] = (attacksByState10Years[state] || 0) + 1;
                            }
                        });
                        
                        // Calculate averages (total attacks / number of years)
                        Object.keys(attacksByState10Years).forEach(state => {
                            avgAttacksByState[state] = attacksByState10Years[state] / 10;
                        });

                        const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                        const stateColorScale = d3.scaleLog()
                            .domain([1, maxStateAttacks])
                            .range(["#ffcccc", "#cc0000"]);
                            //.range(["#ffe6e6", "#cc0000"]);
                        
                        // Draw US states
                        g.selectAll('.state')
                            .data(states.features)
                            .enter()
                            .append('path')
                            .attr('class', 'state')
                            .attr('d', usPath)
                            .attr('fill', d => {
                                const stateName = d.properties.name;
                                const attackCount = attacksByState[stateName] || 0;
                                if (attackCount <= 0) return '#ccc';
                                return stateColorScale(attackCount);
                            })
                            .on('mouseover', function(event, d) {
                                const stateName = d.properties.name;
                                const attackCount = attacksByState[stateName] || 0;
                                const avgAttacks = avgAttacksByState[stateName] || 0;
                            
                                svg.append('text')
                                    .attr('class', 'state-label')
                                    .attr('x', '50%')
                                    .attr('text-anchor', 'middle')
                                    .attr('y', '65%')
                                    .text(`${stateName}: ${attackCount} total attacks since 1900 (${avgAttacks} Attacks/year 2014-2023)`);
                            })
                            .on('mouseout', function() {
                                d3.selectAll('.state-label').remove();
                            });

                        const stateData = sharkData.filter(d => 
                            d.country === "UNITED STATES OF AMERICA"
                        );

                        // ATTACK TYPES
                        const attackTypes = {};
                        stateData.forEach(d => {
                            const type = d.type || 'Unknown';
                            attackTypes[type] = (attackTypes[type] || 0) + 1;
                        });

                        // Convert to array for D3
                        const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                            type,
                            count
                        })).sort((a, b) => b.count - a.count);

                        // ATTACK FATALITY
                        const attackfatality = {};
                        stateData.forEach(d => {
                            const fatal_y_n = d.fatal_y_n || 'Unknown';
                            attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                        });

                        // Convert to array for D3
                        const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                            fatal_y_n,
                            count
                        })).sort((a, b) => b.count - a.count);

                        // VICTIMS ACTIVITY
                        const victimsActivity = {};
                        stateData.forEach(d => {
                            const general_activity = d.general_activity || 'Unknown';
                            victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                        });

                        // Convert to array for D3
                        const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                            general_activity,
                            count
                        })).sort((a, b) => b.count - a.count);

                        const TotalAttacks = attacksByCountry["United States of America"] || 0;

                        // stacked barchart data
                        const combinedData = activityData.map(activity => {
                            const activityTotal = activity.count;
                            const types = stateData
                                .filter(d => d.general_activity === activity.general_activity)
                                .reduce((acc, d) => {
                                    const type = d.type || 'Unknown';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {});

                            return {
                                activity: activity.general_activity,
                                totalPercentage: (activityTotal / TotalAttacks) * 100,
                                types: Object.entries(types).map(([type, count]) => ({
                                    type,
                                    count,
                                    percentage: (count / TotalAttacks) * 100 // key change: scale to total, not activity
                                }))
                            };
                        });

                        //line chart year counts per year
                        const yearCounts = {};
                        let minYear = Infinity;
                        let maxYear = -Infinity;

                        stateData.forEach(entry => {
                            const year = parseInt(entry.year);
                            if (!isNaN(year)) {
                                yearCounts[year] = (yearCounts[year] || 0) + 1;
                                if (year < minYear) minYear = year;
                                if (year > maxYear) maxYear = year;
                            }
                        });

                        // Fill in all years from 1900 to 2024 with 0 if missing
                        const lineChartData = [];
                        //change years if dataset is bigger
                        for (let year = 1900; year <= 2023; year++) {
                            lineChartData.push({
                                year,
                                count: yearCounts[year] || 0
                            });
                        }

                        // Create bar chart
                        //charts.createTypeBarChart(typeData, "UNITED STATES OF AMERICA");
                        charts.createFatalityBarChart(fatalityData, "UNITED STATES OF AMERICA");
                        //charts.createActivityBarChart(activityData, "UNITED STATES OF AMERICA");
                        charts.createStackedBarChart(combinedData, "UNITED STATES OF AMERICA");
                        charts.createLineGraph(lineChartData);

                        const avgAttacks = avgAttacksByCountry["United States of America"];

                        // Update info panel
                        infoDiv.html(`
                            <div class="country-info">
                                <h2 class="country-title">United States of America</h2>
                                <div class="info-stats">
                                    <p class="stat-item">
                                        <span class="stat-icon">🦈</span>
                                        <span class="stat-value">${TotalAttacks}</span>
                                        <span class="stat-label">Total shark attacks since 1900</span>
                                    </p>
                                    <p class="stat-item">
                                        <span class="stat-icon">🦈</span>
                                        <span class="stat-value">${avgAttacks}</span>
                                        <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                                    </p>
                                </div>
                                <button id="reset-btn" class="reset-button">
                                    <i class="fas fa-sync-alt"></i> Back
                                </button>
                            </div>
                        `);
                            
                        // Reset button handler
                        d3.select('#reset-btn').on('click', resetMap);
                    });
                } else if (countryName === 'Australia') {
                    // Load Australia states data from specific GeoJSON
                    Promise.all([
                        d3.json('aust.json'), // Your Australia-specific GeoJSON
                        d3.csv('cleaned_shark_data.csv')
                    ]).then(([ausData, sharkData]) => {
                        // Remove all countries
                        g.selectAll('.country').remove();
                        
                        // Create projection specifically for Australia
                        const ausProjection = d3.geoMercator().scale(width/2).translate([-width/1.5, -height/8]);
                        
                        const ausPath = d3.geoPath(ausProjection);
                        
                        // Filter shark data for Australia
                        const ausSharkData = sharkData.filter(d => 
                            formatCountryName(d.country) === 'Australia'
                        );
                        
                        // Count attacks by state - you may need to adjust property names
                        const attacksByState = {};
                        ausSharkData.forEach(d => {
                            const state = d.area; // or d.state, depending on your data
                            if (state) {
                                attacksByState[state] = (attacksByState[state] || 0) + 1;
                            }
                        });

                        // average attacks in the last 10 years (2014-2023)
                        const ausSharkDataFiltered = ausSharkData.filter(d => {
                            const year = +d.year;
                            return year >= 2014 && year <= 2023;
                        });

                        // Calculate total and average attacks by country in the last 10 years (2014-2023)
                        const attacksByState10Years = {};
                        const avgAttacksByState = {};
                            
                        ausSharkDataFiltered.forEach(d => {
                            const state = d.area;
                            if (state) {
                                attacksByState10Years[state] = (attacksByState10Years[state] || 0) + 1;
                            }
                        });
                            
                        // Calculate averages (total attacks / number of years)
                        Object.keys(attacksByState10Years).forEach(state => {
                            avgAttacksByState[state] = attacksByState10Years[state] / 10;
                        });

                        const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                        const stateColorScale = d3.scaleLinear()
                            .domain([0, maxStateAttacks])
                            .range(["#ffcccc", "#cc0000"]);
                        
                        // Draw Australian states
                        g.selectAll('.state')
                            .data(ausData.features)
                            .enter()
                            .append('path')
                            .attr('class', 'state')
                            .attr('d', ausPath)
                            .attr('fill', d => {
                                const stateName = d.properties.STATE_NAME;
                                const attackCount = attacksByState[stateName] || 0;
                                return attackCount > 0 ? stateColorScale(attackCount) : '#ccc';
                            })
                            .on('mouseover', function(event, d) {
                                const stateName = d.properties.name || d.properties.STATE_NAME;
                                const attackCount = attacksByState[stateName] || 0;
                                const avgAttacks = avgAttacksByState[stateName] || 0;
                            
                                svg.append('text')
                                    .attr('class', 'state-label')
                                    .attr('x', '50%')
                                    .attr('text-anchor', 'middle')
                                    .attr('y', '65%')
                                    .text(`${stateName}: ${attackCount} total attacks since 1900 (${avgAttacks} Attacks/year 2014-2023)`);
                            })
                            .on('mouseout', function() {
                                d3.selectAll('.state-label').remove();
                            })
                            .on('click', function(event, d) {
                                // Optional: Add click handler for individual states
                                const stateName = d.properties.name || d.properties.STATE_NAME;
                                // Show state-specific shark attack data
                            });
                        
                        const stateData = sharkData.filter(d => 
                            d.country === "AUSTRALIA"
                        );
        
                        // ATTACK TYPES
                        const attackTypes = {};
                        stateData.forEach(d => {
                            const type = d.type || 'Unknown';
                            attackTypes[type] = (attackTypes[type] || 0) + 1;
                        });
        
                        // Convert to array for D3
                        const typeData = Object.entries(attackTypes).map(([type, count]) => ({
                            type,
                            count
                        })).sort((a, b) => b.count - a.count);
        
                        // ATTACK FATALITY
                        const attackfatality = {};
                        stateData.forEach(d => {
                            const fatal_y_n = d.fatal_y_n || 'Unknown';
                            attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                        });
        
                        // Convert to array for D3
                        const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                            fatal_y_n,
                            count
                        })).sort((a, b) => b.count - a.count);
        
                        // VICTIMS ACTIVITY
                        const victimsActivity = {};
                        stateData.forEach(d => {
                            const general_activity = d.general_activity || 'Unknown';
                            victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                        });
        
                        // Convert to array for D3
                        const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                            general_activity,
                            count
                        })).sort((a, b) => b.count - a.count);

                        const TotalAttacks = attacksByCountry["Australia"] || 0;

                        // stacked barchart data
                        const combinedData = activityData.map(activity => {
                            const activityTotal = activity.count;
                            const types = stateData
                                .filter(d => d.general_activity === activity.general_activity)
                                .reduce((acc, d) => {
                                    const type = d.type || 'Unknown';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {});

                            return {
                                activity: activity.general_activity,
                                totalPercentage: (activityTotal / TotalAttacks) * 100,
                                types: Object.entries(types).map(([type, count]) => ({
                                    type,
                                    count,
                                    percentage: (count / TotalAttacks) * 100 // key change: scale to total, not activity
                                }))
                            };
                        });

                        //line chart year counts per year
                        const yearCounts = {};
                        let minYear = Infinity;
                        let maxYear = -Infinity;

                        stateData.forEach(entry => {
                            const year = parseInt(entry.year);
                            if (!isNaN(year)) {
                                yearCounts[year] = (yearCounts[year] || 0) + 1;
                                if (year < minYear) minYear = year;
                                if (year > maxYear) maxYear = year;
                            }
                        });

                        // Fill in all years from 1900 to 2024 with 0 if missing
                        const lineChartData = [];
                        //change years if dataset is bigger
                        for (let year = 1900; year <= 2023; year++) {
                            lineChartData.push({
                                year,
                                count: yearCounts[year] || 0
                            });
                        }
        
                        // Create bar chart
                        //charts.createTypeBarChart(typeData, "AUSTRALIA");
                        charts.createFatalityBarChart(fatalityData, "AUSTRALIA");
                        //charts.createActivityBarChart(activityData, "AUSTRALIA");
                        charts.createStackedBarChart(combinedData, "AUSTRALIA");
                        charts.createLineGraph(lineChartData);

                        const avgAttacks = avgAttacksByCountry["Australia"];

                        // Update info panel
                        infoDiv.html(`
                            <div class="country-info">
                                <h2 class="country-title">Australia</h2>
                                <div class="info-stats">
                                    <p class="stat-item">
                                        <span class="stat-icon">🦈</span>
                                        <span class="stat-value">${TotalAttacks}</span>
                                        <span class="stat-label">Total shark attacks since 1900</span>
                                    </p>
                                    <p class="stat-item">
                                        <span class="stat-icon">🦈</span>
                                        <span class="stat-value">${avgAttacks}</span>
                                        <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                                    </p>
                                </div>
                                <button id="reset-btn" class="reset-button">
                                    <i class="fas fa-sync-alt"></i> Back
                                </button>
                            </div>
                        `);
                        
                        d3.select('#reset-btn').on('click', resetMap);
                    });
                } else {
                    g.selectAll('path')
                        .on('mouseover', function(event, d) {
                        })
                        .on('mouseout', function() {
                            d3.selectAll('.country-label').remove();
                        });
                    // Verwijder alle landen behalve het aangeklikte
                    g.selectAll('.country').filter(d => d !== clickedCountry).remove();
                    
                    // Pas de projectie aan
                    const newProjection = d3.geoMercator()
                        .fitSize([width/1.2, height/2], {type: "FeatureCollection", features: [clickedCountry]});
                    
                    // Update het pad van het overgebleven land
                    d3.select(this)
                        .attr('d', d3.geoPath().projection(newProjection));
                    
                    // Toon informatie
                    const countryName = clickedCountry.properties.name;
                    const attackCount = attacksByCountry[countryName] || 0;

                    const countryData = sharkData.filter(d => 
                        d.country.toLowerCase() === countryName.toLowerCase() // moet mss nog aangepast worden
                    );

                    // ATTACK TYPES
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

                    // ATTACK FATALITY
                    const attackfatality = {};
                    countryData.forEach(d => {
                        const fatal_y_n = d.fatal_y_n || 'Unknown';
                        attackfatality[fatal_y_n] = (attackfatality[fatal_y_n] || 0) + 1;
                    });

                    // Convert to array for D3
                    const fatalityData = Object.entries(attackfatality).map(([fatal_y_n, count]) => ({
                        fatal_y_n,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // VICTIMS ACTIVITY
                    const victimsActivity = {};
                    countryData.forEach(d => {
                        const general_activity = d.general_activity || 'Unknown';
                        victimsActivity[general_activity] = (victimsActivity[general_activity] || 0) + 1;
                    });

                    // Convert to array for D3
                    const activityData = Object.entries(victimsActivity).map(([general_activity, count]) => ({
                        general_activity,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // AREA
                    const attackArea = {};
                    countryData.forEach(d => {
                        const area = d.area || 'Unknown';
                        attackArea[area] = (attackArea[area] || 0) + 1;
                    });

                    // Convert to array for D3
                    const areaData = Object.entries(attackArea).map(([area, count]) => ({
                        area,
                        count
                    })).sort((a, b) => b.count - a.count);

                    // Combine activityData and typeData
                    // Combine activity and type data
                    const totalAttacks = activityData.reduce((sum, d) => sum + d.count, 0);

                    const combinedData = activityData.map(activity => {
                        const activityTotal = activity.count;
                        const types = countryData
                            .filter(d => d.general_activity === activity.general_activity)
                            .reduce((acc, d) => {
                                const type = d.type || 'Unknown';
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                            }, {});

                        return {
                            activity: activity.general_activity,
                            totalPercentage: (activityTotal / totalAttacks) * 100,
                            types: Object.entries(types).map(([type, count]) => ({
                                type,
                                count,
                                percentage: (count / totalAttacks) * 100 // key change: scale to total, not activity
                            }))
                        };
                    });

                    //line chart year counts per year
                    const yearCounts = {};
                    let minYear = Infinity;
                    let maxYear = -Infinity;

                    countryData.forEach(entry => {
                        const year = parseInt(entry.year);
                        if (!isNaN(year)) {
                            yearCounts[year] = (yearCounts[year] || 0) + 1;
                            if (year < minYear) minYear = year;
                            if (year > maxYear) maxYear = year;
                        }
                    });

                    // Fill in all years from 1900 to 2024 with 0 if missing
                    const lineChartData = [];
                    //change years if dataset is bigger
                    for (let year = 1900; year <= 2023; year++) {
                        lineChartData.push({
                            year,
                            count: yearCounts[year] || 0
                        });
                    }


                    // Create bar chart
                    //charts.createTypeBarChart(typeData, countryName);
                    charts.createFatalityBarChart(fatalityData, countryName);
                    //charts.createActivityBarChart(activityData, countryName);
                    charts.createStackedBarChart(combinedData, countryName);
                    charts.createLineGraph(lineChartData);
                    //charts.createAreaBarChart(areaData, countryName);
                    
                    let avgAttacks;
                    if (avgAttacksByCountry[countryName]) {
                        avgAttacks = avgAttacksByCountry[countryName];
                    } else {
                        avgAttacks = 0;
                    }
                    
                        
                    infoDiv.html(`
                        <div class="country-info">
                            <h2 class="country-title">${countryName}</h2>
                            <div class="info-stats">
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${attackCount}</span>
                                    <span class="stat-label">Total shark attacks since 1900</span>
                                </p>
                                <p class="stat-item">
                                    <span class="stat-icon">🦈</span>
                                    <span class="stat-value">${avgAttacks}</span>
                                    <span class="stat-label">Average shark attacks per year (2014-2023)</span>
                                </p>
                            </div>
                            <button id="reset-btn" class="reset-button">
                                <i class="fas fa-sync-alt"></i> Back
                            </button>
                        </div>
                    `);
                    
                    d3.select('#reset-btn').on('click', function() {
                        resetMap();
                        // Remove the selected class when resetting
                        d3.select('.country-selected').classed('country-selected', false);
                    });
                }
            });
            
        // Verwijder de bar chart en maak info panel leeg
        d3.select("#barchart-container-type svg").remove();
        d3.select("#barchart-container-type p").remove();
        d3.select("#barchart-container-fatal_y_n svg").remove();
        d3.select("#barchart-container-fatal_y_n p").remove();
        d3.select("#barchart-container-activity svg").remove();
        d3.select("#barchart-container-activity p").remove();
        d3.select("#barchart-container-area svg").remove();
        d3.select("#barchart-container-area p").remove();
        d3.select("#barchart-container-stacked svg").remove();
        d3.select("#barchart-container-stacked p").remove();
        d3.select("#linechart-container svg").remove();
        d3.select("#linechart-container p").remove();
        //infoDiv.html('');
        infoDiv.html(beginInfo)
        
    }

});