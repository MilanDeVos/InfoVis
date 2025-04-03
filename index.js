const width = 900;
const height = 600;

const svg = d3.select('body').append('svg').attr('width', width).attr('height', height);

const projection = d3.geoMercator().scale(140).translate([width/2, height*2/3]);
const path = d3.geoPath(projection);

const g = svg.append('g');


Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
    d3.csv('global_shark_attacks.csv')
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
    g.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
            // Zoek of dit land in de aanvaldata voorkomt
            const countryName = d.properties.name;
            return attacksByCountry[countryName] ? '#ff0000' : '#ccc';
        })
        .on('mouseover', function(event, d) {
            // Toon aantal aanvallen bij hover
            const countryName = d.properties.name;
            const attackCount = attacksByCountry[countryName] || 0;
            
            // Maak een tooltip
            svg.append('text')
                .attr('class', 'country-label')
                .attr('x', '50%')
                .attr('text-anchor', 'middle')
                .attr('y', '90%')
                .text(`${countryName}: ${attackCount} Attacks`);
        })
        .on('mouseout', function() {
            // Verwijder de tooltip
            d3.selectAll('.country-label').remove();
        });
        
    //console.log('Landnamen in haaienaanval data:', attackCountries);
});