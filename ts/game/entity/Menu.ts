module nurdz.game
{
    /**
     * A simple menu item structure.
     */
    export interface MenuItem
    {
        /**
         * The position of this menu item; the text starts at an offset to the right, this specifies where
         * the menu pointer goes.
         */
        position: Point;

        /**
         * The displayed menu text.
         */
        text: string;
    }

    /**
     * This class represents a menu. This is responsible for rendering menu items and handling key input
     * while a menu is active.
     */
    export class Menu extends Actor
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
         * The list of menu items that we contain.
         */
        private _items : Array<MenuItem>;

        /**
         * The currently selected menu item in our item array. This item is visually distinguished from
         * other menu items.
         */
        private _selected : number;

        /**
         * The menu pointer. We always position it so that it marks what the currently selected menu item is.
         */
        private _pointer : Pointer;

        /**
         * The sound to play when the menu selection changes; this can be null, in which case no sound is
         * played.
         */
        private _selectSound : Sound;

        /**
         * Return the menu item index at the currently selected location.
         *
         * @returns {number}
         */
        get selected () : number
        { return this._selected; }

        /**
         * Return the number of items that are currently in the menu.
         *
         * @returns {number}
         */
        get length () : number
        { return this._items.length; }

        /**
         * Construct a new menu which renders its menu text with the font name and size provided.
         *
         * @param stage the stage that will display this menu
         * @param fontName the font name to render the menu with
         * @param fontSize the size of the font to use to render items, in pixels
         * @param sound the sound to play when the menu selection changes.
         */
        constructor (stage : Stage, fontName : string, fontSize : number, sound : Sound = null)
        {
            // Simple super call. We don't have a visual position per se.
            super ("Menu", stage, 0, 0, 0, 0);

            // Store the values provided.
            this._fontName = fontName;
            this._fontSize = fontSize;
            this._selectSound = sound;

            // Combine them together into a single string for later use
            this._fontFullSpec = this._fontSize + "px " + this._fontName;

            // The menu starts out empty.
            this._items = [];
            this._selected = 0;

            // Set up the pointer.
            this._pointer = new Pointer (stage, 0, 0);
        }

        /**
         * Change the location of the menu pointer to point to the currently selected menu item.
         */
        private updateMenuPointer () : void
        {
            if (this._items.length > 0)
                this._pointer.setStagePositionXY (this._items[this._selected].position.x,
                                                  this._items[this._selected].position.y);
        }

        /**
         * Add a new menu item to the list of menu items managed by this menu instance.
         *
         * @param text the text of the menu item
         * @param position the position on the screen of this item.
         */
        addItem (text : string, position : Point)
        {
            // Insert the menu item
            this._items.push (
                {
                    text: text,
                    position: position
                });

            // If the current length of the items array is now 1, the first item is finally here, so
            // position our pointer.
            if (this._items.length == 1)
                this.updateMenuPointer ();
        }

        /**
         * Return the menu item at the provided index, which will be null if the index provided is out of
         * range of the number of items currently maintained in the menu.
         *
         * @param index the index of the item to get
         * @returns {MenuItem} the menu item at the provided index or null if the index is not valid.
         */
        getItem (index : number) : MenuItem
        {
            if (index < 0 || index >= this._items.length)
                return null;

            return this._items[index];
        }

        /**
         * Change the selected menu item to the previous item, if possible.
         *
         * If a sound is associated with the menu, it will be played.
         */
        selectPrevious () : void
        {
            this._selected--;
            if (this._selected < 0)
                this._selected = this._items.length - 1;

            this.updateMenuPointer ();
            if (this._selectSound != null)
                this._selectSound.play ();
        }

        /**
         * Change the selected menu item to the next item, if possible.
         *
         * If a sound is associated with the menu, it will be played.
         */
        selectNext () : void
        {
            this._selected++;
            if (this._selected >= this._items.length)
                this._selected = 0;

            this.updateMenuPointer ();
            if (this._selectSound != null)
                this._selectSound.play ();
        }

        /**
         * Update the state of the menu based on the current tick; we use this to visually mark the
         * currently selected menu item.
         *
         * @param stage the stage that owns us
         * @param tick the current update tick
         */
        update (stage : nurdz.game.Stage, tick : number) : void
        {
            // Make sure our pointer updates
            this._pointer.update (stage, tick);
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
            // Render the pointer at its current position.
            this._pointer.render (this._pointer.position.x, this._pointer.position.y, renderer);

            // Save the context and set up our font and font rendering.
            renderer.context.save ();
            renderer.context.font = this._fontFullSpec;
            renderer.context.textBaseline = "middle";

            // Render all of the text items. We offset them by the width of the pointer that indicates
            // which item is the current item, with a vertical offset that is half of its height. This
            // makes the point on the pointer align with the center of the text.
            for (let i = 0 ; i < this._items.length ; i++)
            {
                let item = this._items[i];
                renderer.drawTxt (item.text, item.position.x + TILE_SIZE,
                                  item.position.y + (TILE_SIZE / 2), 'white');
            }
            renderer.restore ();
        }
    }
}
