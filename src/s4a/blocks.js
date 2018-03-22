// labelPart() proxy

SyntaxElementMorph.prototype.originalLabelPart = SyntaxElementMorph.prototype.labelPart;
SyntaxElementMorph.prototype.labelPart = function(spec) {
    var part,
        block = this;

    switch (spec) {
        case '%servoValue':
            part = new InputSlotMorph(
                    null,
                    false,
                    {
                        'angle (0-180)' : 90,
                        'stopped (1500)' : ['stopped'], 
                        'clockwise (1500-1000)' : ['clockwise'],
                        'counter-clockwise (1500-2000)' : ['counter-clockwise'],
                        'disconnected' : ['disconnected']
                    }
                    );
            break;
        case '%pinMode':
            part = new InputSlotMorph(
                    null,
                    false,
                    {
                        'digital input' : ['digital input'],
                        'digital output' : ['digital output'] ,
                        'PWM' : ['PWM'],
                        'servo' : ['servo']
                    },
                    true
                    );
            break;
        case '%servoPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            return sprite.arduino.pinsSettableToMode(board.MODES.SERVO);
                        } else {
                            return [];
                        }
                    }
                    );
            break;
        case '%pwmPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            // Can't use map because we need to construct keys dynamically
                            var pins = {};
                            Object.keys(sprite.arduino.pinsSettableToMode(board.MODES.PWM)).forEach(function (each) { pins[each + '~'] = each });
                            return pins;
                        } else {
                            return [];
                        }
                    }
                    );
            break;
        case '%analogPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;
                        
                        if (board) { 
                            return board.analogPins.map(
                                    function (each){
                                        return (each - board.analogPins[0]).toString();
                                    });
                        } else { 
                            return [];
                        } 
                    }
                    );
            part.originalChanged = part.changed;
            part.changed = function () { part.originalChanged(); if (block.toggle) { block.toggle.refresh(); } };
            break;
        case '%digitalPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() {
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            var pinNumbers = [],
                                pins = board.pins.filter(
                                        function (each){ 
                                            return each.analogChannel == 127 
                                        });
                            
                            pins.forEach(
                                    function (each) {
                                        pinNumbers.push(pins.indexOf(each).toString());
                                    });

                            return pinNumbers;

                        } else {
                            return [];
                        }
                    }
                    );
            part.originalChanged = part.changed;
            part.changed = function () { part.originalChanged(); if (block.toggle) { block.toggle.refresh(); } };
            break;

        case '%leftPaw':
            part = new SymbolMorph('leftPaw');
            part.size = this.fontSize * 3.5;
            part.color = new Color(255, 255, 255);
            part.isProtectedLabel = false; // zebra colors
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                new Point() : this.embossing;
            part.drawNew();
            break;

        case '%rightPaw':
            part = new SymbolMorph('rightPaw');
            part.size = this.fontSize * 3.5;
            part.color = new Color(255, 255, 255);
            part.isProtectedLabel = false; // zebra colors
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                new Point() : this.embossing;
            part.drawNew();
            break;

        case '%pawValue':
            part = new InputSlotMorph(
                    null,
                    true,
                    {
                        '0': '0',
                        '10': '10',
                        '20': '20',
                        '30': '30',
                        '40': '40',
                        '50': '50',
                        '60': '60',
                        '70': '70',
                        '80': '80',
                        '90': '90',
                        '100': '100',
                        '110': '110',
                        '120': '120',
                        '130': '130',
                        '140': '140',
                        '150': '150',
                        '160': '160',
                        '170': '170',
                        '180': '180'
                    }
                );
            break;

        default:
            part = this.originalLabelPart(spec);
    }
    return part;
};

BlockMorph.prototype.originalUserMenu = BlockMorph.prototype.userMenu;
BlockMorph.prototype.userMenu = function () {
    var menu = this.originalUserMenu();
    if (StageMorph.prototype.enableCodeMapping && this.selector == 'receiveGo') {
        menu.addLine();
        menu.addItem(
                'export as Arduino sketch...',
                'transpileToC'
                );
    }
    return menu;
};

BlockMorph.prototype.transpileToC = function () {
    var ide = this.parentThatIsA(IDE_Morph),
        safeChars = {"á": "a", "à": "a", "ä": "a",
                     "é": "e", "è": "e", "ë": "e",
                     "í": "i", "ì": "i", "ï": "i",
                     "ó": "o", "ò": "o", "ö": "o",
                     "ú": "u", "ù": "u", "ü": "u",
                     "Á": "A", "À": "A", "Ä": "A",
                     "É": "E", "È": "E", "Ë": "E",
                     "Í": "I", "Ì": "I", "Ï": "I",
                     "Ó": "O", "Ò": "O", "Ö": "O",
                     "Ú": "U", "Ù": "U", "Ü": "U",
                     "ç":"c", "Ç": "C", "ñ": "n", "Ñ": "N"},
        fileName = ide.projectName || 'snap4arduino';

    fileName = fileName.replace(/[^\w ]/g, function(char) {
        return safeChars[char] || char;
    });
    fileName = fileName.replace(/ /g,'_')
    fileName = fileName.replace(/[^a-zA-Z0-9_]/g,'');
    try {
        ide.saveFileAs(
                this.world().Arduino.transpile(
                    this.mappedCode(),
                    this.parentThatIsA(ScriptsMorph).children.filter(
                        function (each) {
                            return each instanceof HatBlockMorph &&
                                each.selector == 'receiveMessage';
                        })),
                'application/ino;chartset=utf-8',
                fileName);
    } catch (error) {
        ide.inform('Error exporting to Arduino sketch!', error.message)
    }
};
