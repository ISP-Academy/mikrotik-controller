// WiFi Channel Planner JavaScript

// Channel configurations with frequencies for different bands
const CHANNELS = {
    '2.4': {
        '20': [
            {channel: 1, freq: 2412},
            {channel: 6, freq: 2437},
            {channel: 11, freq: 2462}
        ],
        '40': [
            {channel: 3, freq: 2422},
            {channel: 11, freq: 2462}
        ]
    },
    '5': {
        'unii1': {
            '20': [
                {channel: 36, freq: 5180},
                {channel: 40, freq: 5200},
                {channel: 44, freq: 5220},
                {channel: 48, freq: 5240}
            ],
            '40': [
                {channel: 38, freq: 5190},
                {channel: 46, freq: 5230}
            ],
            '80': [
                {channel: 42, freq: 5210}
            ],
            '160': []
        },
        'unii2': {
            '20': [
                {channel: 52, freq: 5260},
                {channel: 56, freq: 5280},
                {channel: 60, freq: 5300},
                {channel: 64, freq: 5320}
            ],
            '40': [
                {channel: 54, freq: 5270},
                {channel: 62, freq: 5310}
            ],
            '80': [
                {channel: 58, freq: 5290}
            ],
            '160': []
        },
        'unii2c': {
            '20': [
                {channel: 100, freq: 5500},
                {channel: 104, freq: 5520},
                {channel: 108, freq: 5540},
                {channel: 112, freq: 5560},
                {channel: 116, freq: 5580},
                {channel: 120, freq: 5600},
                {channel: 124, freq: 5620},
                {channel: 128, freq: 5640},
                {channel: 132, freq: 5660},
                {channel: 136, freq: 5680},
                {channel: 140, freq: 5700},
                {channel: 144, freq: 5720}
            ],
            '40': [
                {channel: 102, freq: 5510},
                {channel: 110, freq: 5550},
                {channel: 118, freq: 5590},
                {channel: 126, freq: 5630},
                {channel: 134, freq: 5670},
                {channel: 142, freq: 5710}
            ],
            '80': [
                {channel: 106, freq: 5530},
                {channel: 122, freq: 5610},
                {channel: 138, freq: 5690}
            ],
            '160': []
        },
        'unii3': {
            '20': [
                {channel: 149, freq: 5745},
                {channel: 153, freq: 5765},
                {channel: 157, freq: 5785},
                {channel: 161, freq: 5805},
                {channel: 165, freq: 5825}
            ],
            '40': [
                {channel: 151, freq: 5755},
                {channel: 159, freq: 5795}
            ],
            '80': [
                {channel: 155, freq: 5775}
            ],
            '160': []
        }
    },
    '6': {
        'unii5': {  // 5925-6425 MHz (Channels 1-93)
            '20': [
                {channel: 1, freq: 5935}, {channel: 5, freq: 5955}, {channel: 9, freq: 5975}, {channel: 13, freq: 5995},
                {channel: 17, freq: 6015}, {channel: 21, freq: 6035}, {channel: 25, freq: 6055}, {channel: 29, freq: 6075},
                {channel: 33, freq: 6095}, {channel: 37, freq: 6115}, {channel: 41, freq: 6135}, {channel: 45, freq: 6155},
                {channel: 49, freq: 6175}, {channel: 53, freq: 6195}, {channel: 57, freq: 6215}, {channel: 61, freq: 6235},
                {channel: 65, freq: 6255}, {channel: 69, freq: 6275}, {channel: 73, freq: 6295}, {channel: 77, freq: 6315},
                {channel: 81, freq: 6335}, {channel: 85, freq: 6355}, {channel: 89, freq: 6375}, {channel: 93, freq: 6395}
            ],
            '40': [
                {channel: 3, freq: 5945}, {channel: 11, freq: 5985}, {channel: 19, freq: 6025}, {channel: 27, freq: 6065},
                {channel: 35, freq: 6105}, {channel: 43, freq: 6145}, {channel: 51, freq: 6185}, {channel: 59, freq: 6225},
                {channel: 67, freq: 6265}, {channel: 75, freq: 6305}, {channel: 83, freq: 6345}, {channel: 91, freq: 6385}
            ],
            '80': [
                {channel: 7, freq: 5965}, {channel: 23, freq: 6045}, {channel: 39, freq: 6125}, {channel: 55, freq: 6205},
                {channel: 71, freq: 6285}, {channel: 87, freq: 6365}
            ],
            '160': [
                {channel: 15, freq: 6005}, {channel: 47, freq: 6165}, {channel: 79, freq: 6325}
            ]
        },
        'unii6': {  // 6425-6525 MHz (Channels 97-117)
            '20': [
                {channel: 97, freq: 6415}, {channel: 101, freq: 6435}, {channel: 105, freq: 6455}, 
                {channel: 109, freq: 6475}, {channel: 113, freq: 6495}, {channel: 117, freq: 6515}
            ],
            '40': [
                {channel: 99, freq: 6425}, {channel: 107, freq: 6465}, {channel: 115, freq: 6505}
            ],
            '80': [
                {channel: 103, freq: 6445}
            ],
            '160': [
                {channel: 111, freq: 6485}
            ]
        },
        'unii7': {  // 6525-6875 MHz (Channels 121-185)
            '20': [
                {channel: 121, freq: 6535}, {channel: 125, freq: 6555}, {channel: 129, freq: 6575}, {channel: 133, freq: 6595},
                {channel: 137, freq: 6615}, {channel: 141, freq: 6635}, {channel: 145, freq: 6655}, {channel: 149, freq: 6675},
                {channel: 153, freq: 6695}, {channel: 157, freq: 6715}, {channel: 161, freq: 6735}, {channel: 165, freq: 6755},
                {channel: 169, freq: 6775}, {channel: 173, freq: 6795}, {channel: 177, freq: 6815}, {channel: 181, freq: 6835},
                {channel: 185, freq: 6855}
            ],
            '40': [
                {channel: 123, freq: 6545}, {channel: 131, freq: 6585}, {channel: 139, freq: 6625}, {channel: 147, freq: 6665},
                {channel: 155, freq: 6705}, {channel: 163, freq: 6745}, {channel: 171, freq: 6785}, {channel: 179, freq: 6825}
            ],
            '80': [
                {channel: 119, freq: 6525}, {channel: 135, freq: 6605}, {channel: 151, freq: 6685}, 
                {channel: 167, freq: 6765}, {channel: 183, freq: 6845}
            ],
            '160': [
                {channel: 143, freq: 6645}, {channel: 175, freq: 6805}
            ]
        },
        'unii8': {  // 6875-7125 MHz (Channels 189-233)
            '20': [
                {channel: 189, freq: 6875}, {channel: 193, freq: 6895}, {channel: 197, freq: 6915}, {channel: 201, freq: 6935},
                {channel: 205, freq: 6955}, {channel: 209, freq: 6975}, {channel: 213, freq: 6995}, {channel: 217, freq: 7015},
                {channel: 221, freq: 7035}, {channel: 225, freq: 7055}, {channel: 229, freq: 7075}, {channel: 233, freq: 7095}
            ],
            '40': [
                {channel: 187, freq: 6865}, {channel: 195, freq: 6905}, {channel: 203, freq: 6945}, 
                {channel: 211, freq: 6985}, {channel: 219, freq: 7025}, {channel: 227, freq: 7065}
            ],
            '80': [
                {channel: 199, freq: 6925}, {channel: 215, freq: 7005}
            ],
            '160': [
                {channel: 207, freq: 6965}
            ]
        }
    }
};

// Channel colors for visualization
const CHANNEL_COLORS = {
    // 2.4 GHz channels - Red tones
    2412: '#FF6B6B',  // Ch 1 - Red
    2437: '#FF8E53',  // Ch 6 - Orange-Red
    2462: '#FD79A8',  // Ch 11 - Pink-Red
    2422: '#E74C3C',  // Ch 3 - Dark Red
    
    // 5 GHz UNII-1 - Blue tones
    5180: '#3498DB',  // Ch 36 - Blue
    5200: '#5DADE2',  // Ch 40 - Light Blue
    5220: '#85C1E9',  // Ch 44 - Lighter Blue
    5240: '#AED6F1',  // Ch 48 - Very Light Blue
    5190: '#2E86AB',  // Ch 38 - Dark Blue
    5230: '#A569BD',  // Ch 46 - Purple-Blue
    5210: '#6C5CE7',  // Ch 42 - Purple
    
    // 5 GHz UNII-2A - Green tones
    5260: '#27AE60',  // Ch 52 - Green
    5280: '#58D68D',  // Ch 56 - Light Green
    5300: '#82E0AA',  // Ch 60 - Lighter Green
    5320: '#ABEBC6',  // Ch 64 - Very Light Green
    5270: '#229954',  // Ch 54 - Dark Green
    5310: '#52C41A',  // Ch 62 - Lime Green
    5290: '#73C6B6',  // Ch 58 - Teal Green
    
    // 5 GHz UNII-2C - Purple/Magenta tones
    5500: '#9B59B6',  // Ch 100 - Purple
    5520: '#8E44AD',  // Ch 104 - Dark Purple
    5540: '#BF6EDB',  // Ch 108 - Light Purple
    5560: '#D2A8E3',  // Ch 112 - Lighter Purple
    5580: '#E74C8C',  // Ch 116 - Magenta
    5600: '#EC7063',  // Ch 120 - Pink-Red
    5620: '#F1948A',  // Ch 124 - Light Pink
    5640: '#D98880',  // Ch 128 - Dusty Rose
    5660: '#C39BD3',  // Ch 132 - Lavender
    5680: '#BB8FCE',  // Ch 136 - Medium Lavender
    5700: '#A569BD',  // Ch 140 - Deep Lavender
    5720: '#AF7AC5',  // Ch 144 - Amethyst
    5510: '#9B59B6',  // Ch 102 - Purple
    5550: '#8E44AD',  // Ch 110 - Dark Purple
    5590: '#BF6EDB',  // Ch 118 - Light Purple
    5630: '#D2A8E3',  // Ch 126 - Lighter Purple
    5670: '#E74C8C',  // Ch 134 - Magenta
    5710: '#EC7063',  // Ch 142 - Pink-Red
    5530: '#9B59B6',  // Ch 106 - Purple
    5610: '#8E44AD',  // Ch 122 - Dark Purple
    5690: '#BF6EDB',  // Ch 138 - Light Purple
    
    // 5 GHz UNII-3 - Yellow/Orange tones
    5745: '#F39C12',  // Ch 149 - Orange
    5765: '#F7DC6F',  // Ch 153 - Light Yellow
    5785: '#F8C471',  // Ch 157 - Light Orange
    5805: '#F5B041',  // Ch 161 - Orange-Yellow
    5825: '#EB984E',  // Ch 165 - Dark Orange
    5755: '#F4D03F',  // Ch 151 - Yellow
    5795: '#E67E22',  // Ch 159 - Dark Orange
    5775: '#D68910',  // Ch 155 - Gold
    5815: '#CA6F1E',  // Ch 163 - Brown-Orange
    
    // 6 GHz channels - Cyan/Teal tones
    // 20 MHz
    5935: '#00CED1', 5955: '#00BFFF', 5975: '#00B2EE', 5995: '#00A5CD',
    6015: '#0099CC', 6035: '#008B8B', 6055: '#007F7F', 6075: '#006666',
    6095: '#20B2AA', 6115: '#48D1CC', 6135: '#40E0D0', 6155: '#00CED1',
    6175: '#5F9EA0', 6195: '#4682B4', 6215: '#00BFFF', 6235: '#1E90FF',
    6255: '#00B2EE', 6275: '#00A5CD', 6295: '#0099CC', 6315: '#008B8B',
    6335: '#007F7F', 6355: '#006666', 6375: '#20B2AA', 6395: '#48D1CC',
    6415: '#40E0D0', 6435: '#00CED1', 6455: '#5F9EA0', 6475: '#4682B4',
    6495: '#00BFFF', 6515: '#1E90FF', 6535: '#00B2EE', 6555: '#00A5CD',
    6575: '#0099CC', 6595: '#008B8B', 6615: '#007F7F', 6635: '#006666',
    6655: '#20B2AA', 6675: '#48D1CC', 6695: '#40E0D0', 6715: '#00CED1',
    6735: '#5F9EA0', 6755: '#4682B4', 6775: '#00BFFF', 6795: '#1E90FF',
    6815: '#00B2EE', 6835: '#00A5CD', 6855: '#0099CC', 6875: '#008B8B',
    6895: '#007F7F', 6915: '#006666', 6935: '#20B2AA', 6955: '#48D1CC',
    6975: '#40E0D0', 6995: '#00CED1', 7015: '#5F9EA0', 7035: '#4682B4',
    7055: '#00BFFF', 7075: '#1E90FF', 7095: '#00B2EE',
    // 40 MHz
    5945: '#00CED1', 5985: '#00BFFF', 6025: '#00B2EE', 6065: '#00A5CD',
    6105: '#0099CC', 6145: '#008B8B', 6185: '#007F7F', 6225: '#006666',
    6265: '#20B2AA', 6305: '#48D1CC', 6345: '#40E0D0', 6385: '#00CED1',
    6425: '#5F9EA0', 6465: '#4682B4', 6505: '#00BFFF', 6545: '#1E90FF',
    6585: '#00B2EE', 6625: '#00A5CD', 6665: '#0099CC', 6705: '#008B8B',
    6745: '#007F7F', 6785: '#006666', 6825: '#20B2AA', 6865: '#48D1CC',
    6905: '#40E0D0', 6945: '#00CED1', 6985: '#5F9EA0', 7025: '#4682B4',
    7065: '#00BFFF',
    // 80 MHz
    5965: '#00CED1', 6045: '#00BFFF', 6125: '#00B2EE', 6205: '#00A5CD',
    6285: '#0099CC', 6365: '#008B8B', 6445: '#007F7F', 6525: '#006666',
    6605: '#20B2AA', 6685: '#48D1CC', 6765: '#40E0D0', 6845: '#00CED1',
    6925: '#5F9EA0', 7005: '#4682B4',
    // 160 MHz
    6005: '#00CED1', 6165: '#00BFFF', 6325: '#00B2EE', 6485: '#00A5CD',
    6645: '#0099CC', 6805: '#008B8B', 6965: '#007F7F'
};

// Global variables
let currentPlan = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    validateChannelWidth();
    updateBuildingDiagram(); // Initialize with default values
});

function initializeEventListeners() {
    // Form submission
    document.getElementById('wifiPlannerForm').addEventListener('submit', handleFormSubmit);
    
    // Band selection changes
    document.getElementById('band24').addEventListener('change', handleBandChange);
    document.getElementById('band5').addEventListener('change', handleBandChange);
    
    // Channel width changes
    document.getElementById('channelWidth').addEventListener('change', validateChannelWidth);
}

function handleBandChange(e) {
    if (e.target.id === 'band5') {
        // Toggle sub-bands visibility
        const subBands = document.getElementById('band5SubBands');
        subBands.style.display = e.target.checked ? 'block' : 'none';
        
        // Enable/disable sub-band checkboxes
        const subCheckboxes = subBands.querySelectorAll('input[type="checkbox"]');
        subCheckboxes.forEach(cb => {
            cb.disabled = !e.target.checked;
            if (!e.target.checked) cb.checked = false;
        });
    }
    
    validateChannelWidth();
}

function validateChannelWidth() {
    const band24 = document.getElementById('band24').checked;
    const band5 = document.getElementById('band5').checked;
    const channelWidthSelect = document.getElementById('channelWidth');
    const options = channelWidthSelect.options;
    
    // Disable channel widths > 20 MHz if only 2.4 GHz is selected
    for (let i = 0; i < options.length; i++) {
        const width = parseInt(options[i].value);
        if (band24 && !band5 && width > 40) {
            options[i].disabled = true;
            if (options[i].selected) {
                channelWidthSelect.value = '20';
            }
        } else {
            options[i].disabled = false;
        }
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate at least one band is selected
    const bands = document.querySelectorAll('input[name="bands"]:checked');
    if (bands.length === 0) {
        showOutput('Please select at least one frequency band', 'error');
        return;
    }
    
    // Collect form data
    const formData = {
        roomsAlong: parseInt(document.getElementById('roomsAlong').value),
        roomsAcross: parseInt(document.getElementById('roomsAcross').value),
        floors: parseInt(document.getElementById('floors').value),
        channelWidth: document.getElementById('channelWidth').value,
        bands: {
            '2.4': document.getElementById('band24').checked,
            '5': document.getElementById('band5').checked,
            '6': document.getElementById('band6').checked
        },
        subBands5: {
            unii1: document.getElementById('unii1').checked,
            unii2: document.getElementById('unii2').checked,
            unii2c: document.getElementById('unii2c').checked,
            unii3: document.getElementById('unii3').checked
        },
        subBands6: {
            unii5: document.getElementById('unii5').checked,
            unii6: document.getElementById('unii6').checked,
            unii7: document.getElementById('unii7').checked,
            unii8: document.getElementById('unii8').checked
        },
        apDensity: parseInt(document.querySelector('input[name="apDensity"]:checked').value)
    };
    
    // Generate channel plan
    generateChannelPlan(formData);
}

function generateChannelPlan(formData) {
    showOutput('Generating channel plan...', 'info');
    
    // Create building structure
    const building = createBuildingStructure(formData);
    
    // Assign channels to APs
    const channelAssignments = assignChannels(building, formData);
    
    // Store current plan
    currentPlan = {
        formData: formData,
        building: building,
        channels: channelAssignments
    };
    
    // Show visualization
    showVisualization();
    
    // Render the building
    renderBuilding();
    
    // Update legend and statistics
    updateLegend();
    updateStatistics();
    
    showOutput('Channel plan generated successfully!', 'success');
}

function createBuildingStructure(formData) {
    const building = {
        floors: [],
        totalRooms: 0,
        totalAPs: 0
    };
    
    for (let floor = 0; floor < formData.floors; floor++) {
        const floorData = {
            level: floor + 1,
            rooms: [],
            aps: []
        };
        
        // Create rooms
        for (let row = 0; row < formData.roomsAcross; row++) {
            for (let col = 0; col < formData.roomsAlong; col++) {
                const room = {
                    id: `F${floor + 1}-R${row + 1}-C${col + 1}`,
                    floor: floor + 1,
                    row: row,
                    col: col,
                    apId: null,
                    channel: null
                };
                floorData.rooms.push(room);
                building.totalRooms++;
            }
        }
        
        // Place APs based on density
        placeAPs(floorData, formData);
        building.totalAPs += floorData.aps.length;
        
        building.floors.push(floorData);
    }
    
    return building;
}

function placeAPs(floorData, formData) {
    const roomsPerAP = formData.apDensity;
    const roomsAlong = formData.roomsAlong;
    const roomsAcross = formData.roomsAcross;
    
    if (roomsPerAP === 1) {
        // Place one AP per room - centered in the room
        floorData.rooms.forEach((room, index) => {
            const ap = {
                id: `AP-F${room.floor}-${index + 1}`,
                floor: room.floor,
                position: {
                    row: room.row + 0.5,
                    col: room.col + 0.5,
                    type: 'room'
                },
                rooms: [room.id],
                channel: null
            };
            floorData.aps.push(ap);
            room.apId = ap.id;
        });
    } else {
        // Place APs strategically based on coverage area
        let apIndex = 0;
        
        if (roomsPerAP === 2) {
            // For 2 rooms per AP - place APs in hallway between rooms
            for (let col = 0; col < roomsAlong; col += 1) {
                const ap = {
                    id: `AP-F${floorData.level}-${apIndex + 1}`,
                    floor: floorData.level,
                    position: {
                        row: (roomsAcross - 1) / 2, // Center in hallway between rows
                        col: col, // Along the hallway
                        type: 'hallway'
                    },
                    rooms: [],
                    channel: null
                };
                
                // Assign exactly 2 rooms (one from each side of hallway)
                let roomsAssigned = 0;
                for (let r = 0; r < roomsAcross && roomsAssigned < 2; r++) {
                    const roomIndex = r * roomsAlong + col;
                    if (roomIndex < floorData.rooms.length) {
                        const room = floorData.rooms[roomIndex];
                        ap.rooms.push(room.id);
                        room.apId = ap.id;
                        roomsAssigned++;
                    }
                }
                
                if (ap.rooms.length > 0) {
                    floorData.aps.push(ap);
                    apIndex++;
                }
            }
        } else if (roomsPerAP === 4) {
            // For 4 rooms per AP, place at intersection of 2x2 room groups
            for (let row = 0; row < roomsAcross; row += 2) {
                for (let col = 0; col < roomsAlong; col += 2) {
                    const ap = {
                        id: `AP-F${floorData.level}-${apIndex + 1}`,
                        floor: floorData.level,
                        position: {
                            row: row + 0.5, // Center between room rows in this group
                            col: col + 0.5, // Center between room columns in this group
                            type: 'hallway'
                        },
                        rooms: [],
                        channel: null
                    };
                    
                    // Assign exactly 4 rooms in 2x2 group
                    let roomsAssigned = 0;
                    for (let r = row; r < Math.min(row + 2, roomsAcross) && roomsAssigned < 4; r++) {
                        for (let c = col; c < Math.min(col + 2, roomsAlong) && roomsAssigned < 4; c++) {
                            const roomIndex = r * roomsAlong + c;
                            if (roomIndex < floorData.rooms.length) {
                                const room = floorData.rooms[roomIndex];
                                ap.rooms.push(room.id);
                                room.apId = ap.id;
                                roomsAssigned++;
                            }
                        }
                    }
                    
                    if (ap.rooms.length > 0) {
                        floorData.aps.push(ap);
                        apIndex++;
                    }
                }
            }
        } else if (roomsPerAP === 6) {
            // For 6 rooms per AP - simple systematic approach
            for (let row = 0; row < roomsAcross; row += 2) {
                for (let col = 0; col < roomsAlong; col += 3) {
                    const ap = {
                        id: `AP-F${floorData.level}-${apIndex + 1}`,
                        floor: floorData.level,
                        position: {
                            row: row + 0.5, // Center between 2 rows
                            col: col + 1, // Center of 3 columns
                            type: 'hallway'
                        },
                        rooms: [],
                        channel: null
                    };
                    
                    // Assign exactly 6 rooms (2 rows × 3 columns)
                    let roomsAssigned = 0;
                    for (let r = row; r < Math.min(row + 2, roomsAcross) && roomsAssigned < 6; r++) {
                        for (let c = col; c < Math.min(col + 3, roomsAlong) && roomsAssigned < 6; c++) {
                            const roomIndex = r * roomsAlong + c;
                            if (roomIndex < floorData.rooms.length) {
                                const room = floorData.rooms[roomIndex];
                                ap.rooms.push(room.id);
                                room.apId = ap.id;
                                roomsAssigned++;
                            }
                        }
                    }
                    
                    if (ap.rooms.length > 0) {
                        floorData.aps.push(ap);
                        apIndex++;
                    }
                }
            }
        } else {
            // For 8+ rooms per AP, use larger rectangular groupings
            const roomsPerGroup = Math.ceil(roomsPerAP / roomsAcross);
            
            for (let col = 0; col < roomsAlong; col += roomsPerGroup) {
                const ap = {
                    id: `AP-F${floorData.level}-${apIndex + 1}`,
                    floor: floorData.level,
                    position: {
                        row: (roomsAcross - 1) / 2, // Center between room rows
                        col: col + (roomsPerGroup - 1) / 2, // Center of coverage area
                        type: 'hallway'
                    },
                    rooms: [],
                    channel: null
                };
                
                // Assign rooms to this AP
                for (let c = col; c < Math.min(col + roomsPerGroup, roomsAlong); c++) {
                    for (let r = 0; r < roomsAcross; r++) {
                        const roomIndex = r * roomsAlong + c;
                        if (roomIndex < floorData.rooms.length) {
                            const room = floorData.rooms[roomIndex];
                            ap.rooms.push(room.id);
                            room.apId = ap.id;
                        }
                    }
                }
                
                if (ap.rooms.length > 0) {
                    floorData.aps.push(ap);
                    apIndex++;
                }
            }
        }
    }
}

function assignChannels(building, formData) {
    const channelsByBand = getChannelsByBand(formData);
    const assignments = {};
    
    if (Object.keys(channelsByBand).length === 0) {
        showOutput('No available channels for selected configuration', 'error');
        return assignments;
    }
    
    // Smart channel assignment with frequency separation for multiple bands
    building.floors.forEach((floor, floorIndex) => {
        // Sort APs by position for systematic assignment
        const sortedAPs = [...floor.aps].sort((a, b) => {
            if (a.position.row !== b.position.row) {
                return a.position.row - b.position.row;
            }
            return a.position.col - b.position.col;
        });
        
        sortedAPs.forEach((ap, apIndex) => {
            // Assign channels from each selected band
            const apChannels = {};
            
            Object.keys(channelsByBand).forEach(band => {
                const availableChannels = channelsByBand[band];
                if (availableChannels.length > 0) {
                    if (band === '2.4') {
                        // For 2.4 GHz, try a systematic pattern first, then interference-based
                        const bestChannel = findBest24GHzChannel(ap, floor, building, availableChannels, assignments, apIndex);
                        apChannels[band] = bestChannel;
                    } else {
                        // For other bands, use normal selection
                        const bestChannel = findBestChannelForBand(ap, floor, building, availableChannels, assignments, band);
                        apChannels[band] = bestChannel;
                    }
                }
            });
            
            ap.channels = apChannels;
            assignments[ap.id] = apChannels;
            
            // Update rooms with channel info
            ap.rooms.forEach(roomId => {
                const room = floor.rooms.find(r => r.id === roomId);
                if (room) {
                    room.channels = apChannels;
                }
            });
        });
    });
    
    return assignments;
}

function findBestChannel(currentAP, currentFloor, building, availableChannels, assignments) {
    // Calculate interference score for each available channel
    const channelScores = availableChannels.map(channel => {
        let score = 0;
        
        // Check interference from APs on same floor
        currentFloor.aps.forEach(ap => {
            if (ap.id !== currentAP.id && assignments[ap.id]) {
                const distance = calculateAPDistance(currentAP.position, ap.position);
                const freqSeparation = Math.abs(assignments[ap.id].freq - channel.freq);
                
                // Higher score is worse (more interference)
                if (freqSeparation < 20) {
                    score += 100 / (distance + 1);
                } else if (freqSeparation < 40) {
                    score += 50 / (distance + 1);
                } else if (freqSeparation < 80) {
                    score += 20 / (distance + 1);
                }
            }
        });
        
        // Check interference from adjacent floors
        const floorIndex = building.floors.indexOf(currentFloor);
        [-1, 1].forEach(offset => {
            const adjacentFloor = building.floors[floorIndex + offset];
            if (adjacentFloor) {
                adjacentFloor.aps.forEach(ap => {
                    if (assignments[ap.id]) {
                        const distance = calculateAPDistance(currentAP.position, ap.position);
                        const freqSeparation = Math.abs(assignments[ap.id].freq - channel.freq);
                        
                        // Vertical interference is less than horizontal
                        if (freqSeparation < 20) {
                            score += 50 / (distance + 1);
                        } else if (freqSeparation < 40) {
                            score += 25 / (distance + 1);
                        }
                    }
                });
            }
        });
        
        return { channel, score };
    });
    
    // Sort by lowest interference score
    channelScores.sort((a, b) => a.score - b.score);
    
    return channelScores[0].channel;
}

function calculateAPDistance(pos1, pos2) {
    const dx = pos1.col - pos2.col;
    const dy = pos1.row - pos2.row;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateFrequencyRange(centerFreq, channelWidth) {
    // Calculate the frequency range based on center frequency and channel width
    const halfWidth = channelWidth / 2;
    const lowerFreq = centerFreq - halfWidth;
    const upperFreq = centerFreq + halfWidth;
    
    return `[${lowerFreq}-${upperFreq} MHz]`;
}

function getChannelsByBand(formData) {
    const channelsByBand = {};
    const width = formData.channelWidth;
    
    if (formData.bands['2.4']) {
        const band24Channels = CHANNELS['2.4'][width] || CHANNELS['2.4']['20'];
        channelsByBand['2.4'] = band24Channels;
    }
    
    if (formData.bands['5']) {
        let band5Channels = [];
        if (formData.subBands5.unii1) {
            const unii1Channels = CHANNELS['5']['unii1'][width] || CHANNELS['5']['unii1']['20'];
            band5Channels.push(...unii1Channels);
        }
        if (formData.subBands5.unii2) {
            const unii2Channels = CHANNELS['5']['unii2'][width] || CHANNELS['5']['unii2']['20'];
            band5Channels.push(...unii2Channels);
        }
        if (formData.subBands5.unii2c) {
            const unii2cChannels = CHANNELS['5']['unii2c'][width] || CHANNELS['5']['unii2c']['20'];
            band5Channels.push(...unii2cChannels);
        }
        if (formData.subBands5.unii3) {
            const unii3Channels = CHANNELS['5']['unii3'][width] || CHANNELS['5']['unii3']['20'];
            band5Channels.push(...unii3Channels);
        }
        if (band5Channels.length > 0) {
            channelsByBand['5'] = band5Channels;
        }
    }
    
    if (formData.bands['6']) {
        let band6Channels = [];
        if (formData.subBands6.unii5) {
            const unii5Channels = CHANNELS['6']['unii5'][width] || CHANNELS['6']['unii5']['20'];
            band6Channels.push(...unii5Channels);
        }
        if (formData.subBands6.unii6) {
            const unii6Channels = CHANNELS['6']['unii6'][width] || CHANNELS['6']['unii6']['20'];
            band6Channels.push(...unii6Channels);
        }
        if (formData.subBands6.unii7) {
            const unii7Channels = CHANNELS['6']['unii7'][width] || CHANNELS['6']['unii7']['20'];
            band6Channels.push(...unii7Channels);
        }
        if (formData.subBands6.unii8) {
            const unii8Channels = CHANNELS['6']['unii8'][width] || CHANNELS['6']['unii8']['20'];
            band6Channels.push(...unii8Channels);
        }
        if (band6Channels.length > 0) {
            channelsByBand['6'] = band6Channels;
        }
    }
    
    return channelsByBand;
}

function findBestChannelForBand(currentAP, currentFloor, building, availableChannels, assignments, band) {
    // Calculate interference score for each available channel in this band
    const channelScores = availableChannels.map(channel => {
        let score = 0;
        
        // Check interference from APs on same floor
        currentFloor.aps.forEach(ap => {
            if (ap.id !== currentAP.id && assignments[ap.id] && assignments[ap.id][band]) {
                const distance = calculateAPDistance(currentAP.position, ap.position);
                const freqSeparation = Math.abs(assignments[ap.id][band].freq - channel.freq);
                
                // For 2.4 GHz, be strict about adjacent placement but not extreme
                if (band === '2.4') {
                    if (freqSeparation < 25) { // Same or overlapping channels (1, 6, 11 are 25 MHz apart)
                        // Horizontal or vertical adjacency (not diagonal)
                        const rowDiff = Math.abs(currentAP.position.row - ap.position.row);
                        const colDiff = Math.abs(currentAP.position.col - ap.position.col);
                        const isDirectlyAdjacent = (rowDiff <= 1 && colDiff === 0) || (rowDiff === 0 && colDiff <= 1);
                        
                        if (isDirectlyAdjacent) {
                            // Heavy penalty for directly adjacent same-channel APs
                            score += 1000;
                        } else if (distance <= 2) {
                            // Moderate penalty for close same-channel APs
                            score += 200 / (distance + 0.1);
                        } else {
                            // Light penalty for distant same-channel APs
                            score += 50 / (distance + 0.1);
                        }
                    }
                } else {
                    // For 5 GHz, use frequency separation
                    if (freqSeparation < 20) {
                        score += 100 / (distance + 1);
                    } else if (freqSeparation < 40) {
                        score += 50 / (distance + 1);
                    } else if (freqSeparation < 80) {
                        score += 20 / (distance + 1);
                    }
                }
            }
        });
        
        // Check interference from adjacent floors
        const floorIndex = building.floors.indexOf(currentFloor);
        [-1, 1].forEach(offset => {
            const adjacentFloor = building.floors[floorIndex + offset];
            if (adjacentFloor) {
                adjacentFloor.aps.forEach(ap => {
                    if (assignments[ap.id] && assignments[ap.id][band]) {
                        const distance = calculateAPDistance(currentAP.position, ap.position) + 1; // Add floor separation
                        const freqSeparation = Math.abs(assignments[ap.id][band].freq - channel.freq);
                        
                        if (band === '2.4') {
                            if (freqSeparation < 25) {
                                // For vertical separation, still penalize but less severely
                                score += 500 / distance;
                            }
                        } else {
                            if (freqSeparation < 20) {
                                score += 50 / distance;
                            } else if (freqSeparation < 40) {
                                score += 25 / distance;
                            }
                        }
                    }
                });
            }
        });
        
        // Add a small randomization factor to break ties
        score += Math.random() * 0.1;
        
        return { channel, score };
    });
    
    // Sort by lowest interference score
    channelScores.sort((a, b) => a.score - b.score);
    
    return channelScores[0].channel;
}

function findBest24GHzChannel(currentAP, currentFloor, building, availableChannels, assignments, apIndex) {
    // For 2.4 GHz, try a pattern-based approach first
    const channels24 = [
        {channel: 1, freq: 2412},
        {channel: 6, freq: 2437}, 
        {channel: 11, freq: 2462}
    ];
    
    // Try systematic pattern: 1, 6, 11, 1, 6, 11...
    const patternChannel = channels24[apIndex % 3];
    
    // Check if this pattern channel would cause adjacent conflicts (horizontal, vertical, or floor-to-floor)
    let hasAdjacentConflict = false;
    
    // Check same floor for horizontal/vertical adjacency
    currentFloor.aps.forEach(ap => {
        if (ap.id !== currentAP.id && assignments[ap.id] && assignments[ap.id]['2.4']) {
            const freqSeparation = Math.abs(assignments[ap.id]['2.4'].freq - patternChannel.freq);
            
            // Check for direct adjacency with same channel
            const rowDiff = Math.abs(currentAP.position.row - ap.position.row);
            const colDiff = Math.abs(currentAP.position.col - ap.position.col);
            const isDirectlyAdjacent = (rowDiff <= 1 && colDiff === 0) || (rowDiff === 0 && colDiff <= 1);
            
            if (freqSeparation < 25 && isDirectlyAdjacent) {
                hasAdjacentConflict = true;
            }
        }
    });
    
    // Check floors above and below for vertical conflicts
    const floorIndex = building.floors.indexOf(currentFloor);
    [-1, 1].forEach(offset => {
        const adjacentFloor = building.floors[floorIndex + offset];
        if (adjacentFloor) {
            adjacentFloor.aps.forEach(ap => {
                if (assignments[ap.id] && assignments[ap.id]['2.4']) {
                    const freqSeparation = Math.abs(assignments[ap.id]['2.4'].freq - patternChannel.freq);
                    
                    // Check if AP is directly above/below (same position)
                    const rowDiff = Math.abs(currentAP.position.row - ap.position.row);
                    const colDiff = Math.abs(currentAP.position.col - ap.position.col);
                    const isDirectlyAboveBelow = (rowDiff <= 0.5 && colDiff <= 0.5);
                    
                    if (freqSeparation < 25 && isDirectlyAboveBelow) {
                        hasAdjacentConflict = true;
                    }
                }
            });
        }
    });
    
    // If pattern channel works, use it. Otherwise fall back to interference-based selection
    if (!hasAdjacentConflict) {
        return patternChannel;
    } else {
        // Fall back to interference-based selection
        return findBestChannelForBand(currentAP, currentFloor, building, availableChannels, assignments, '2.4');
    }
}

function createMultiBandBackground(channels) {
    const bands = Object.keys(channels).sort(); // Sort bands for consistent ordering
    const colors = bands.map(band => {
        const channel = channels[band];
        return CHANNEL_COLORS[channel.freq] || '#ddd';
    });
    
    if (bands.length === 2) {
        // Split vertically for 2 bands
        return `linear-gradient(90deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
    } else if (bands.length === 3) {
        // Split into three vertical sections
        return `linear-gradient(90deg, ${colors[0]} 33.33%, ${colors[1]} 33.33%, ${colors[1]} 66.66%, ${colors[2]} 66.66%)`;
    } else {
        // Fallback for more than 3 bands
        const percentage = 100 / bands.length;
        const gradientStops = colors.map((color, index) => {
            const start = index * percentage;
            const end = (index + 1) * percentage;
            return `${color} ${start}%, ${color} ${end}%`;
        }).join(', ');
        return `linear-gradient(90deg, ${gradientStops})`;
    }
}

function getAvailableChannels(formData) {
    const channels = [];
    const width = formData.channelWidth;
    
    if (formData.bands['2.4']) {
        const band24Channels = CHANNELS['2.4'][width] || CHANNELS['2.4']['20'];
        channels.push(...band24Channels);
    }
    
    if (formData.bands['5']) {
        if (formData.subBands5.unii1) {
            const unii1Channels = CHANNELS['5']['unii1'][width] || CHANNELS['5']['unii1']['20'];
            channels.push(...unii1Channels);
        }
        if (formData.subBands5.unii2) {
            const unii2Channels = CHANNELS['5']['unii2'][width] || CHANNELS['5']['unii2']['20'];
            channels.push(...unii2Channels);
        }
        if (formData.subBands5.unii2c) {
            const unii2cChannels = CHANNELS['5']['unii2c'][width] || CHANNELS['5']['unii2c']['20'];
            channels.push(...unii2cChannels);
        }
        if (formData.subBands5.unii3) {
            const unii3Channels = CHANNELS['5']['unii3'][width] || CHANNELS['5']['unii3']['20'];
            channels.push(...unii3Channels);
        }
    }
    
    if (formData.bands['6']) {
        if (formData.subBands6.unii5) {
            const unii5Channels = CHANNELS['6']['unii5'][width] || CHANNELS['6']['unii5']['20'];
            channels.push(...unii5Channels);
        }
        if (formData.subBands6.unii6) {
            const unii6Channels = CHANNELS['6']['unii6'][width] || CHANNELS['6']['unii6']['20'];
            channels.push(...unii6Channels);
        }
        if (formData.subBands6.unii7) {
            const unii7Channels = CHANNELS['6']['unii7'][width] || CHANNELS['6']['unii7']['20'];
            channels.push(...unii7Channels);
        }
        if (formData.subBands6.unii8) {
            const unii8Channels = CHANNELS['6']['unii8'][width] || CHANNELS['6']['unii8']['20'];
            channels.push(...unii8Channels);
        }
    }
    
    return channels.length > 0 ? channels : [{channel: 1, freq: 2412}]; // Fallback to channel 1
}

function showVisualization() {
    document.getElementById('visualizationPanel').style.display = 'block';
}

function renderBuilding() {
    const container = document.getElementById('buildingVisualization');
    container.innerHTML = '';
    
    renderFloorPlan(container);
}


function renderFloorPlan(container) {
    // Find the visualization controls area to add floor selector
    const visualizationHeader = document.querySelector('.visualization-header');
    let floorSelectorContainer = document.querySelector('.floor-selector-container');
    
    if (!floorSelectorContainer) {
        floorSelectorContainer = document.createElement('div');
        floorSelectorContainer.className = 'floor-selector-container';
        
        const label = document.createElement('label');
        label.textContent = 'Select Floor: ';
        label.style.marginRight = '10px';
        label.style.fontWeight = '600';
        label.style.color = '#2c3e50';
        
        const select = document.createElement('select');
        select.className = 'floor-selector';
        select.id = 'floorSelector';
        
        floorSelectorContainer.appendChild(label);
        floorSelectorContainer.appendChild(select);
        
        // Insert in the controls
        const controls = visualizationHeader.querySelector('.visualization-controls');
        controls.appendChild(floorSelectorContainer);
    }
    
    // Update floor selector options
    const select = document.getElementById('floorSelector');
    const building = currentPlan.building;
    select.innerHTML = '';
    
    building.floors.forEach((floor, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Floor ${floor.level}`;
        select.appendChild(option);
    });
    
    // Always show the floor selector
    floorSelectorContainer.style.display = 'flex';
    floorSelectorContainer.style.alignItems = 'center';
    floorSelectorContainer.style.gap = '10px';
    
    const floorContainer = document.createElement('div');
    container.appendChild(floorContainer);
    
    // Render first floor by default
    renderSingleFloor(floorContainer, 0);
    
    // Remove any existing event listener and add new one
    select.removeEventListener('change', handleFloorChange);
    select.addEventListener('change', handleFloorChange);
    
    function handleFloorChange(e) {
        renderSingleFloor(floorContainer, parseInt(e.target.value));
    }
}

function renderSingleFloor(container, floorIndex) {
    container.innerHTML = '';
    const floor = currentPlan.building.floors[floorIndex];
    const formData = currentPlan.formData;
    
    // Calculate dimensions with proper scaling
    const baseRoomSize = 60;
    const spacing = 5;
    
    // Calculate building dimensions
    const buildingWidth = formData.roomsAlong * (baseRoomSize + spacing);
    const buildingHeight = formData.roomsAcross * (baseRoomSize + spacing);
    
    // Calculate scale to fit in container
    const containerPadding = 40;
    const availableWidth = (container.clientWidth || 600) - containerPadding;
    const availableHeight = (container.clientHeight || 400) - containerPadding;
    
    const scale = Math.min(availableWidth / buildingWidth, availableHeight / buildingHeight, 1, 0.9); // Max 90% scale
    const roomSize = baseRoomSize * scale;
    const scaledSpacing = spacing * scale;
    
    const floorDiv = document.createElement('div');
    floorDiv.style.position = 'relative';
    floorDiv.style.margin = '20px auto';
    floorDiv.style.width = `${buildingWidth * scale}px`;
    floorDiv.style.height = `${buildingHeight * scale}px`;
    floorDiv.style.border = '2px solid #dee2e6';
    floorDiv.style.borderRadius = '8px';
    floorDiv.style.backgroundColor = '#f8f9fa';
    
    // Render rooms
    floor.rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-cube';
        roomDiv.style.position = 'absolute';
        roomDiv.style.width = `${roomSize}px`;
        roomDiv.style.height = `${roomSize}px`;
        roomDiv.style.left = `${room.col * (roomSize + scaledSpacing)}px`;
        roomDiv.style.top = `${room.row * (roomSize + scaledSpacing)}px`;
        roomDiv.style.fontSize = `${Math.max(8, roomSize * 0.2)}px`;
        
        // Handle multiple frequency bands with split colors
        if (room.channels) {
            const bands = Object.keys(room.channels);
            if (bands.length === 1) {
                // Single band
                const channel = room.channels[bands[0]];
                roomDiv.style.backgroundColor = CHANNEL_COLORS[channel.freq] || '#ddd';
                roomDiv.textContent = channel.channel;
            } else if (bands.length > 1) {
                // Multiple bands - create split colors
                roomDiv.style.background = createMultiBandBackground(room.channels);
                // Use same sorted order as background colors
                const sortedBands = Object.keys(room.channels).sort();
                roomDiv.textContent = sortedBands.map(band => room.channels[band].channel).join('/');
                roomDiv.style.fontSize = `${Math.max(6, roomSize * 0.15)}px`; // Smaller font for multiple channels
            }
            
            // Create tooltip with all channel info
            const channelInfo = bands.map(band => {
                const channel = room.channels[band];
                return `${band}GHz: Ch ${channel.channel} (${channel.freq} MHz)`;
            }).join('\\n');
            roomDiv.title = `${room.id}\\nChannels:\\n${channelInfo}\\nClick for AP details`;
        } else {
            roomDiv.style.backgroundColor = '#ddd';
            roomDiv.textContent = '-';
            roomDiv.title = `${room.id}\\nNo channels assigned\\nClick for AP details`;
        }
        
        roomDiv.onclick = () => showAPInfo(room.id);
        roomDiv.style.cursor = 'pointer';
        
        floorDiv.appendChild(roomDiv);
    });
    
    // Render APs
    floor.aps.forEach(ap => {
        const apDiv = document.createElement('div');
        apDiv.className = `ap-marker ${ap.position.type === 'hallway' ? 'hallway-ap' : 'room-ap'}`;
        apDiv.style.position = 'absolute';
        
        // Scale AP marker size based on room size
        const apSize = Math.max(20, roomSize * 0.6);
        apDiv.style.width = `${apSize}px`;
        apDiv.style.height = `${apSize}px`;
        apDiv.style.fontSize = `${Math.max(10, apSize * 0.8)}px`;
        
        apDiv.style.left = `${(ap.position.col) * (roomSize + scaledSpacing) + roomSize/2 - apSize/2}px`;
        apDiv.style.top = `${(ap.position.row) * (roomSize + scaledSpacing) + roomSize/2 - apSize/2}px`;
        apDiv.title = `${ap.id}\nChannel: ${ap.channel ? ap.channel.channel + ' (' + ap.channel.freq + ' MHz)' : 'None'}`;
        apDiv.innerHTML = '📡';
        
        floorDiv.appendChild(apDiv);
    });
    
    container.appendChild(floorDiv);
}

function updateLegend() {
    const legendContainer = document.getElementById('channelLegend');
    legendContainer.innerHTML = '';
    
    // Get unique channels used across all bands
    const usedChannels = new Map();
    currentPlan.building.floors.forEach(floor => {
        floor.aps.forEach(ap => {
            if (ap.channels) {
                Object.values(ap.channels).forEach(channel => {
                    usedChannels.set(channel.freq, channel);
                });
            }
        });
    });
    
    // Get current channel width
    const channelWidth = parseInt(currentPlan.formData.channelWidth);
    
    // Create legend items
    Array.from(usedChannels.values())
        .sort((a, b) => a.freq - b.freq)
        .forEach(channel => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = CHANNEL_COLORS[channel.freq] || '#ddd';
            
            // Calculate frequency range based on channel width
            const frequencyRange = calculateFrequencyRange(channel.freq, channelWidth);
            
            const label = document.createElement('span');
            label.className = 'legend-label';
            label.innerHTML = `Ch ${channel.channel} (${channel.freq} MHz) <span class="frequency-range">${frequencyRange}</span>`;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
        });
}

function updateStatistics() {
    const statsContainer = document.getElementById('planStatistics');
    const building = currentPlan.building;
    const formData = currentPlan.formData;
    
    const stats = [
        { label: 'Total Rooms', value: building.totalRooms },
        { label: 'Total APs', value: building.totalAPs },
        { label: 'Rooms per AP', value: formData.apDensity },
        { label: 'Channel Width', value: `${formData.channelWidth} MHz` },
        { label: 'Floors', value: formData.floors }
    ];
    
    statsContainer.innerHTML = '';
    stats.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.className = 'stat-item';
        
        const label = document.createElement('span');
        label.className = 'stat-label';
        label.textContent = stat.label;
        
        const value = document.createElement('span');
        value.className = 'stat-value';
        value.textContent = stat.value;
        
        statDiv.appendChild(label);
        statDiv.appendChild(value);
        statsContainer.appendChild(statDiv);
    });
}


function exportPlan() {
    if (!currentPlan) {
        showOutput('No plan to export', 'error');
        return;
    }
    
    // Create export data
    const exportData = {
        timestamp: new Date().toISOString(),
        configuration: currentPlan.formData,
        building: currentPlan.building,
        channelAssignments: currentPlan.channels
    };
    
    // Convert to JSON and download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wifi-channel-plan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showOutput('Channel plan exported successfully!', 'success');
}

function resetForm() {
    document.getElementById('wifiPlannerForm').reset();
    document.getElementById('visualizationPanel').style.display = 'none';
    currentPlan = null;
    showOutput('Form reset', 'info');
}

function showAPInfo(roomId) {
    if (!currentPlan) return;
    
    // Find the room and its AP
    let targetRoom = null;
    let targetAP = null;
    
    currentPlan.building.floors.forEach(floor => {
        const room = floor.rooms.find(r => r.id === roomId);
        if (room) {
            targetRoom = room;
            targetAP = floor.aps.find(ap => ap.id === room.apId);
        }
    });
    
    if (!targetRoom || !targetAP) return;
    
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.onclick = closeAPPopup;
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'ap-info-popup';
    
    // Popup header
    const header = document.createElement('div');
    header.className = 'popup-header';
    
    const title = document.createElement('h3');
    title.className = 'popup-title';
    title.textContent = `📡 ${targetAP.id}`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'popup-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = closeAPPopup;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Popup content
    const content = document.createElement('div');
    content.className = 'popup-content';
    
    // AP Type
    const typeRow = document.createElement('div');
    typeRow.className = 'popup-info-row';
    typeRow.innerHTML = `
        <span class="popup-label">AP Type:</span>
        <span class="popup-value">${targetAP.position.type === 'room' ? 'In-Room' : 'Hallway'}</span>
    `;
    
    // Channel Info
    if (targetAP.channels && Object.keys(targetAP.channels).length > 0) {
        Object.keys(targetAP.channels).forEach(band => {
            const channel = targetAP.channels[band];
            const channelRow = document.createElement('div');
            channelRow.className = 'popup-info-row';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'popup-channel-color';
            colorBox.style.backgroundColor = CHANNEL_COLORS[channel.freq] || '#ddd';
            
            channelRow.innerHTML = `
                <span class="popup-label">${band} GHz Channel:</span>
                <div style="display: flex; align-items: center;">
                    <span class="popup-value">Ch ${channel.channel} (${channel.freq} MHz)</span>
                </div>
            `;
            channelRow.querySelector('div').appendChild(colorBox);
            content.appendChild(channelRow);
        });
    } else {
        const channelRow = document.createElement('div');
        channelRow.className = 'popup-info-row';
        channelRow.innerHTML = `
            <span class="popup-label">Channels:</span>
            <span class="popup-value">Not Assigned</span>
        `;
        content.appendChild(channelRow);
    }
    
    // Room Coverage
    const roomsRow = document.createElement('div');
    roomsRow.className = 'popup-info-row';
    roomsRow.innerHTML = `
        <span class="popup-label">Covers ${targetAP.rooms.length} Room(s):</span>
    `;
    
    const roomsList = document.createElement('div');
    roomsList.className = 'popup-rooms-list';
    targetAP.rooms.forEach(roomId => {
        const roomItem = document.createElement('div');
        roomItem.className = 'popup-room-item';
        roomItem.textContent = roomId;
        roomsList.appendChild(roomItem);
    });
    
    content.appendChild(typeRow);
    content.appendChild(roomsRow);
    content.appendChild(roomsList);
    
    popup.appendChild(header);
    popup.appendChild(content);
    
    // Add to document
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    
    // Add keyboard support
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeAPPopup();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Store handler for cleanup
    popup._keyHandler = handleKeyDown;
}

function closeAPPopup() {
    const overlay = document.querySelector('.popup-overlay');
    const popup = document.querySelector('.ap-info-popup');
    
    // Remove keyboard handler
    if (popup && popup._keyHandler) {
        document.removeEventListener('keydown', popup._keyHandler);
    }
    
    if (overlay) overlay.remove();
    if (popup) popup.remove();
    
    // Restore scroll
    document.body.style.overflow = '';
}

function updateBuildingDiagram() {
    const roomsAlong = parseInt(document.getElementById('roomsAlong').value) || 10;
    const roomsAcross = parseInt(document.getElementById('roomsAcross').value) || 2;
    
    // Limit values to prevent excessive DOM elements
    const maxAlong = Math.min(roomsAlong, 20);
    const maxAcross = Math.min(roomsAcross, 4);
    
    const hallwayDiagram = document.querySelector('.hallway-diagram');
    hallwayDiagram.innerHTML = '';
    
    // Create room rows
    for (let row = 0; row < maxAcross; row++) {
        const roomRow = document.createElement('div');
        roomRow.className = 'room-row';
        
        for (let col = 0; col < maxAlong; col++) {
            const roomBox = document.createElement('div');
            roomBox.className = 'room-box';
            roomBox.textContent = 'R';
            roomRow.appendChild(roomBox);
        }
        
        hallwayDiagram.appendChild(roomRow);
        
        // Add hallway line between rows (except after last row)
        if (row < maxAcross - 1) {
            const hallwayLine = document.createElement('div');
            hallwayLine.className = 'hallway-line';
            hallwayLine.innerHTML = '<span>← Hallway →</span>';
            hallwayDiagram.appendChild(hallwayLine);
        }
    }
    
    showOutput(`Building layout updated: ${roomsAlong} × ${roomsAcross} rooms`, 'info');
}

function showOutput(message, type = 'info') {
    const outputArea = document.getElementById('outputArea');
    const timestamp = new Date().toLocaleTimeString();
    const className = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
    
    outputArea.innerHTML = `<div class="output-message ${className}">[${timestamp}] ${message}</div>`;
    
    // Auto-scroll to bottom
    outputArea.scrollTop = outputArea.scrollHeight;
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Toggle sub-bands visibility for 5 GHz
    const band5Checkbox = document.getElementById('band5');
    const band5SubBands = document.getElementById('band5SubBands');
    
    band5Checkbox.addEventListener('change', function() {
        band5SubBands.style.display = this.checked ? 'block' : 'none';
    });
    
    // Toggle sub-bands visibility for 6 GHz
    const band6Checkbox = document.getElementById('band6');
    const band6SubBands = document.getElementById('band6SubBands');
    
    band6Checkbox.addEventListener('change', function() {
        band6SubBands.style.display = this.checked ? 'block' : 'none';
    });
    
    // Initialize visibility based on initial checkbox states
    band5SubBands.style.display = band5Checkbox.checked ? 'block' : 'none';
    band6SubBands.style.display = band6Checkbox.checked ? 'block' : 'none';
});