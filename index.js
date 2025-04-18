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
        
        // usa moet United Stated of America worden
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
            // Check if a country is already selected
            if (d3.select('.country-selected').size() > 0) {
                return; // Exit if a country is already selected
            }
            
            // Mark this country as selected
            d3.select(this).classed('country-selected', true);

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
            charts.createAreaBarChart(areaData, countryName);

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
                // Check if a country is already selected
                if (d3.select('.country-selected').size() > 0) {
                    return; // Exit if a country is already selected
                }
                
                // Mark this country as selected
                d3.select(this).classed('country-selected', true);

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
                charts.createAreaBarChart(areaData, countryName);
                    
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