import * as charts from './charts.js';

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

    const maxAttacks = d3.max(Object.values(attacksByCountry)) || 1;
    const colorScale = d3.scaleLinear()
    .domain([0, maxAttacks])
    .range(["#ffcccc", "#cc0000"]); // licht naar donkerrood

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
            return attackCount > 0 ? colorScale(attackCount) : '#ccc';
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
            // Check if a country is already selected
            if (d3.select('.country-selected').size() > 0) {
                return; // Exit if a country is already selected
            }
            
            // Mark this country as selected
            d3.select(this).classed('country-selected', true);

            const countryName = clickedCountry.properties.name;
            console.log(countryName);

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
                        .translate([width/2, height/2])
                        .scale(width);
                        
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
                        const state = d.area; // or whatever field contains state info
                        if (state) {
                            attacksByState[state] = (attacksByState[state] || 0) + 1;
                        }
                    });

                    const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                        const stateColorScale = d3.scaleLinear()
                            .domain([0, maxStateAttacks])
                            .range(["#ffcccc", "#cc0000"]);
                    
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
                            return attackCount > 0 ? stateColorScale(attackCount) : '#ccc';
                        })
                        .on('mouseover', function(event, d) {
                            const stateName = d.properties.name;
                            const attackCount = attacksByState[stateName] || 0;
                            
                            svg.append('text')
                                .attr('class', 'state-label')
                                .attr('x', '50%')
                                .attr('text-anchor', 'middle')
                                .attr('y', '95%')
                                .text(`${stateName}: ${attackCount} Attacks`);
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

                    // Create bar chart
                    charts.createTypeBarChart(typeData, "UNITED STATES OF AMERICA");
                    charts.createFatalityBarChart(fatalityData, "UNITED STATES OF AMERICA");
                    charts.createActivityBarChart(activityData, "UNITED STATES OF AMERICA");
                        
                    // Update info panel for USA view
                    infoDiv.html(`
                        <h2>United States</h2>
                        <p>Click on a state to see details</p>
                        <button id="reset-btn">Reset Map</button>
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
                    const ausProjection = d3.geoMercator()
                        .fitSize([width, height], ausData); // Automatically fits Australia to view
                    
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
                            
                            svg.append('text')
                                .attr('class', 'state-label')
                                .attr('x', '50%')
                                .attr('text-anchor', 'middle')
                                .attr('y', '95%')
                                .text(`${stateName}: ${attackCount} Attacks`);
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

                    // Create bar chart
                    charts.createTypeBarChart(typeData, "AUSTRALIA");
                    charts.createFatalityBarChart(fatalityData, "AUSTRALIA");
                    charts.createActivityBarChart(activityData, "AUSTRALIA");

                    // Update info panel
                    infoDiv.html(`
                        <h2>Australia</h2>
                        <p>Shark attacks by state/territory</p>
                        <button id="reset-btn">Reset Map</button>
                    `);
                    
                    d3.select('#reset-btn').on('click', resetMap);
                });
            } else { // on click any other country just zoom

                // Verwijder alle landen behalve het aangeklikte
                countryPaths.filter(d => d !== clickedCountry).remove();
                
                // Pas de projectie aan om het geselecteerde land naar links te verplaatsen
                const newProjection = d3.geoMercator()
                    .scale(140)
                    .translate([width/4, height*2/3]) // Verplaats naar links (1/4 in plaats van 1/2)
                    .fitSize([width*2/3, height*2/3], {type: "FeatureCollection", features: [clickedCountry]});
                
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

                // Create bar chart
                charts.createTypeBarChart(typeData, countryName);
                charts.createFatalityBarChart(fatalityData, countryName);
                charts.createActivityBarChart(activityData, countryName);
                //charts.createAreaBarChart(areaData, countryName);

                infoDiv.html(`
                    <h2>${countryName}</h2>
                    <p>Total shark attacks: ${attackCount}</p>
                    <button id="reset-btn">Reset Map</button>
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
                            .translate([width/2, height/2])
                            .scale(width);
                            
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

                        const maxStateAttacks = d3.max(Object.values(attacksByState)) || 1;
                        const stateColorScale = d3.scaleLinear()
                            .domain([0, maxStateAttacks])
                            .range(["#ffcccc", "#cc0000"]);
                        
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
                                return attackCount > 0 ? stateColorScale(attackCount) : '#ccc';
                            })
                            .on('mouseover', function(event, d) {
                                const stateName = d.properties.name;
                                const attackCount = attacksByState[stateName] || 0;
                                
                                svg.append('text')
                                    .attr('class', 'state-label')
                                    .attr('x', '50%')
                                    .attr('text-anchor', 'middle')
                                    .attr('y', '95%')
                                    .text(`${stateName}: ${attackCount} Attacks`);
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

                        // Create bar chart
                        charts.createTypeBarChart(typeData, "UNITED STATES OF AMERICA");
                        charts.createFatalityBarChart(fatalityData, "UNITED STATES OF AMERICA");
                        charts.createActivityBarChart(activityData, "UNITED STATES OF AMERICA");
                            
                        // Update info panel for USA view
                        infoDiv.html(`
                            <h2>United States</h2>
                            <p>Click on a state to see details</p>
                            <button id="reset-btn">Reset Map</button>
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
                        const ausProjection = d3.geoMercator()
                            .fitSize([width, height], ausData); // Automatically fits Australia to view
                        
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
                                
                                svg.append('text')
                                    .attr('class', 'state-label')
                                    .attr('x', '50%')
                                    .attr('text-anchor', 'middle')
                                    .attr('y', '95%')
                                    .text(`${stateName}: ${attackCount} Attacks`);
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
        
                        // Create bar chart
                        charts.createTypeBarChart(typeData, "AUSTRALIA");
                        charts.createFatalityBarChart(fatalityData, "AUSTRALIA");
                        charts.createActivityBarChart(activityData, "AUSTRALIA");
                            
                        // Update info panel
                        infoDiv.html(`
                            <h2>Australia</h2>
                            <p>Shark attacks by state/territory</p>
                            <button id="reset-btn">Reset Map</button>
                        `);
                        
                        d3.select('#reset-btn').on('click', resetMap);
                    });
                } else {

                    // Verwijder alle landen behalve het aangeklikte
                    g.selectAll('.country').filter(d => d !== clickedCountry).remove();
                    
                    // Pas de projectie aan
                    const newProjection = d3.geoMercator()
                        .scale(140)
                        .translate([width/4, height*2/3])
                        .fitSize([width*2/3, height*2/3], {type: "FeatureCollection", features: [clickedCountry]});
                    
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

                    // Create bar chart
                    charts.createTypeBarChart(typeData, countryName);
                    charts.createFatalityBarChart(fatalityData, countryName);
                    charts.createActivityBarChart(activityData, countryName);
                    //charts.createAreaBarChart(areaData, countryName);
                        
                    infoDiv.html(`
                        <h2>${countryName}</h2>
                        <p>Total shark attacks: ${attackCount}</p>
                        <button id="reset-btn">Reset Map</button>
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
        infoDiv.html('');
    }

});