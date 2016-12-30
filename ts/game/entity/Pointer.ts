module nurdz.game
{
    /**
     * The properties that a capsule can have.
     */
    interface PointerProperties extends EntityProperties
    {
        /**
         * When true, we render ourselves when asked; otherwise we silently ignore render calls.
         */
        visible? : boolean;

        /**
         * The rotation of the pointer, in degrees. The default orientation corresponds to a rotation
         * angle of 0, which points the pointer to the right. 90 degrees is facing down.
         */
        rotation? : number;
    }

    /**
     * This entity represents a simplistic pointer, which is just a tile sized entity that appears to
     * slowly flash and points downwards. It's used for our debug logic.
     */
    export class Pointer extends Entity
    {
        /**
         * Redeclare our pointer properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : PointerProperties;
        get properties () : PointerProperties
        { return this._properties; }

        /**
         * The index into the color list that indicates what color to render ourselves.
         *
         * @type {number}
         */
        private _colorIndex : number = 0;

        /**
         * The list of colors that we use to display ourselves.
         *
         * @type {Array<string>}
         */
        private _colors : Array<string> = ['#ffffff', '#aaaaaa'];

        /**
         * The polygon that represents us.
         *
         * @type {Polygon}
         */
        private _poly : Polygon = [
            [-(TILE_SIZE / 2) + 4, -(TILE_SIZE / 2) + 4],
            [(TILE_SIZE / 2) - 4, 0],
            [-(TILE_SIZE / 2) + 4, (TILE_SIZE / 2) - 4],
        ];

        /**
         * Create the pointer object to be owned by the stage.
         *
         * @param stage the stage that owns this pointer
         * @param x the X location of the pointer
         * @param y the Y location of the pointer`
         * @param rotation the rotation of the pointer initially.
         */
        constructor (stage : Stage, x : number, y : number, rotation : number = 0)
        {
            super ("Cursor", stage, x, y, TILE_SIZE, TILE_SIZE, 1, <PointerProperties> {
                visible: true,
                rotation: rotation
            });
        }

        /**
         * Called every frame to update ourselves. This causes our color to change.
         *
         * @param stage the stage that the actor is on
         * @param tick the game tick; this is a count of how many times the game loop has executed
         */
        update (stage : Stage, tick : number) : void
        {
            if (tick % 7 == 0)
            {
                this._colorIndex++;
                if (this._colorIndex == this._colors.length)
                    this._colorIndex = 0;
            }
        }

        /**
         * Render ourselves as an arrow rotated in the direction that we are rotated for.
         *
         * @param x the X location of where to draw ourselves
         * @param y the Y location of where to draw ourselves
         * @param renderer the renderer to use to draw ourselves
         */
        render (x : number, y : number, renderer : Renderer) : void
        {
            // Only render if we're visible.
            if (this._properties.visible)
            {
                // Get ready for rendering. The X, Y we get is our upper left corner but in order to
                // render properly we need it to be our center.
                renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2),
                                             this._properties.rotation);
                renderer.fillPolygon (this._poly, this._colors[this._colorIndex]);
                renderer.restore ();
            }
        }
    }
}
