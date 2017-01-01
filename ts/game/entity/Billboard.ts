module nurdz.game
{
    /**
     * How wide our billboard is, in pixels.
     */
    const BILLBOARD_WIDTH = STAGE_WIDTH / 3;

    /**
     * How tall our billboard is, in pixels.
     */
    const BILLBOARD_HEIGHT = STAGE_HEIGHT / 5;

    /**
     * The color of the frame on the billboard
     */
    const BILLBOARD_FRAME_COLOR = "#1a5276";

    /**
     * The color of the background of the billboard.
     */
    const BILLBOARD_BACK_COLOR = "#515a5a";

    /**
     * This is a simple billboard entity; it renders itself as a box in the
     * center of the screen with some text centered in it.
     *
     * This could be enhanced to be animated, styled, etc.
     */
    export class Billboard extends Entity
    {
        /**
         * The name of the font as given in the constructor.
         */
        private _fontName : string;

        /**
         * The size of our font, in pixels.
         */
        private _fontSize : number;

        /**
         * The full font string specification; this is a combination of the font name and size.
         */
        private _fontFullSpec : string;

        /**
         * The text currently stored in the billboard.
         */
        private _text : string;

        /**
         * An indication as to whether we are visible or not.
         */
        private _visible : boolean;

        /**
         * Get the text that the billboard is currently displaying
         *
         * @returns {string} the current billboard text
         */
        get text () : string
        { return this._text; }

        /**
         * Set the text that the billboard should display.
         *
         * @param {string} newString the text to display on this billboard
         */
        set text (newString : string)
        { this.updateText (newString); }

        /**
         * Get an indication as to whether this billboard will render itself or
         * not.
         *
         * @returns {boolean} true if this billboard will render itself or false
         * otherwise
         */
        get visible () : boolean
        { return this._visible; }

        /**
         * Change the visiblity state of this billboard. When this is false, the
         * billboard does not render
         *
         * @param {boolean} newVisible the new state of the visibilty flag
         */
        set visible (newVisible : boolean)
        { this._visible = newVisible; }
        /**
         * Construct a new billboard entity which will render on the given stage
         * using the provided font name and font size.
         *
         * A billboard starts with no empty text; You can set the text to
         * whatever you desire.
         *
         * @param stage the stage that will display this menu
         * @param fontName the font name to render the menu with
         * @param fontSize the size of the font to use to render items, in
         * pixels
         */
        constructor (stage : Stage, fontName : string, fontSize : number)
        {
            // Our billboard is centered on the stage and of a defined size
            // always.
            super ("billboard", stage,
                (STAGE_WIDTH / 2) - (BILLBOARD_WIDTH / 2),
                (STAGE_HEIGHT / 2) - (BILLBOARD_HEIGHT / 2),
                BILLBOARD_WIDTH, BILLBOARD_HEIGHT, 1, {}, {});

            // Store the values provided.
            this._fontName = fontName;
            this._fontSize = fontSize;

            // Combine them together into a single string for later use
            this._fontFullSpec = this._fontSize + "px " + this._fontName;

            // Set some default text and start out hidden.
            this.text = "";
            this._visible = false;
        }

        /**
         * Update the text that should be displayed in this billboard, and
         * recalculate all internal values needed to render it properly.
         *
         * This is a raw internal operation.
         *
         * @param {string} newText the new text
         */
        private updateText (newText : string)
        {
            this._text = newText;
        }

        /**
         * Display the billboard on the stage with the given text.
         *
         * This is essentially a shortcut for altering the text and making sure
         * that the visibilty is on.
         *
         * @param {string} text the text to display in the billboard
         */
        show (text : string) : void
        {
            // Change the text using the accessor and be visible
            this.text = text;
            this._visible = true;
        }

        /**
         * For orthogonality, this will hide the billboard by turning off its
         * visibility. This leaves the text intact.
         */
        hide () : void
        {
            this.visible = false;
        }

        /**
         * Render ourselves using the provided renderer. This will render out the text as well as the
         * current pointer.
         *
         * The position provided to us is ignored; we already have an idea of where exactly our contents
         * will render.
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            if (this._visible == false)
                return;

            // Draw the frame first.
            renderer.fillRect (x, y, this._width, this._height, BILLBOARD_BACK_COLOR);
            renderer.strokeRect (x, y, this._width, this._height, BILLBOARD_FRAME_COLOR, 4);

            // Save the context and set up our font and font rendering. We want
            // to horizontally and vertically center text around a point.
            renderer.context.save ();
            renderer.context.font = this._fontFullSpec;
            renderer.context.textAlign = "center";
            renderer.context.textBaseline = "middle";

            // Render our text at the center of the stage
            renderer.drawTxt (this._text, STAGE_WIDTH / 2, STAGE_HEIGHT / 2, 'white');

            // Restore the context now.
            renderer.restore ();
        }
    }
}
