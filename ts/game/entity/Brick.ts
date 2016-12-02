module nurdz.game
{
    /**
     * This is used to specify the valid values for brick types. A brick may
     * be a solid brick, a gray brick (solid, but vanishes near the end of the
     * game), or background (decorative, non-colliding).
     */
    export enum BrickType
    {
        BRICK_SOLID,
        BRICK_GRAY,
        BRICK_BACKGROUND
    }

    /**
     * The entity that represents bricks (background, permanent and temporary)
     * in the game.
     */
    export class Brick extends MazeCell
    {
        /**
         * The type of this brick; the default is background until otherwise
         * set.
         */
        private _brickType : BrickType;

        /**
         * Set the brick type for the current brick. This visually changes the
         * appearance of the brick.
         *
         * @param {BrickType} newType the new type of the brick.
         */
        set brickType (newType : BrickType)
        {
            // Set the type of the brick to the one passed in, then set the
            // sprite in the current sprite sheet to match it.
            this._brickType = newType;
            switch (this._brickType)
            {
                case BrickType.BRICK_SOLID:
                    this._sprite = 0;
                    break;

                case BrickType.BRICK_GRAY:
                    this._sprite = 5;
                    break;

                default:
                    this._sprite = 1;
                    break;
            }
        }

        /**
         * Get the brick type of this brick.
         *
         * @returns {BrickType} the current brick type for this brick; this
         * corresponds to the visual appearance of the brick on the screen.
         */
        get brickType () : BrickType
        {
            return this._brickType;
        }

        /**
         * Construct a new brick entity that will render on the stage provided.
         *
         * This supports all three kinds of bricks: The permanent bricks that
         * surround the play area, the background of the play area, and the gray
         * blocks that impede ball movement until all balls are pushed.
         *
         * @param {Stage}     stage       the stage that we use to render
         * ourselves
         * @param {BrickType} typeOfBrick the type of brick entity this should
         * be
         */
        constructor (stage : Stage, typeOfBrick : BrickType = BrickType.BRICK_SOLID)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (stage, "brick");

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Set a default brick type.
            this.brickType = typeOfBrick;
        }

        /**
         * This callback is invoked when our sprite sheet finishes loading the
         * underlying image for the sprites. It allows us to set our bounds to
         * be a rectangle at the dimensions of the sprites in the sprite sheet.
         */
        private setDimensions = (sheet : SpriteSheet) : void =>
        {
            // Alter our collision properties
            this.makeRectangle (sheet.width, sheet.height);
        }
    }

}