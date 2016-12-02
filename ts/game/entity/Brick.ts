module nurdz.game
{
    /**
     * This is used to specify the valid values for brick types. This includes
     * static bricks that make up the level, as well as bricks that make up the
     * actual play area.
     */
    export enum BrickType
    {
        BRICK_BACKGROUND,
        BRICK_SOLID,
        BRICK_GRAY,
        BRICK_BONUS
    }

    /**
     * The entity that represents the bricks in the game. These can be used for
     * level geometry or in the actual play area. Some of them are statically
     * displayed while some of them can animate themselves appearing or
     * vanishing away.
     */
    export class Brick extends MazeCell
    {
        /**
         * The type of this brick, which is used to determine how the player can
         * interact with it, and also specifies how it is represented
         * graphically.
         */
        private _brickType : BrickType;

        /**
         * Set the brick type for the current brick. This visually changes the
         * appearance of the brick as well.
         *
         * For static bricks, this changes rendering to the appropriate sprite,
         * while for animated bricks it selects an idle animation. It favors the
         * idle animation that shows the brick being present on the screen.
         *
         * @param {BrickType} newType the new type of the brick.
         */
        set brickType (newType : BrickType)
        {
            // First, set our internal type flag to the one provided.
            this._brickType = newType;

            // Now set up visuals. For non-animated bricks, we just set the
            // sprite from the sprite sheet. For animated bricks, we need to
            // start playing the appropriate idle animation.
            //
            // This works because the Maze entity makes sure to only call update
            // for animated brick entities, and that call will mess with the
            // current sprite.
            switch (this._brickType)
            {
                // These are primarily used to represent the outer bounds of the
                // play area.
                case BrickType.BRICK_SOLID:
                    this._sprite = 0;
                    break;

                // These appear in the game grid and stop the ball, but vanish
                // away near the end of the game to allow for final ball
                // movement.
                case BrickType.BRICK_GRAY:
                    this.playAnimation ("gray_idle");
                    break;

                // These appear in the game grid; they don't actually block
                // movement of the ball, but as the ball passes through them
                // they award bonus points.
                case BrickType.BRICK_BONUS:
                    this.playAnimation ("bonus_idle");
                    break;

                // Everything else is just a background brick. These are used to
                // represent the back wall of the play area.
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

            // The non-animated bricks don't have their update methods called,
            // so no special setup is needed here.
            //
            // For the animated brick types, we set up animations for them,
            // which includes the idle states (where they are not animating).
            this.addAnimation ("gray_idle",       1, false, [5]);
            this.addAnimation ("gray_idle_gone",  1, false, [9]);
            this.addAnimation ("gray_vanish",    10, false, [5, 6, 7, 8, 9]);
            this.addAnimation ("gray_appear",    10, false, [9, 8, 7, 6, 5]);

            this.addAnimation ("bonus_idle",       1, false, [30]);
            this.addAnimation ("bonus_idle_gone",  1, false, [34]);
            this.addAnimation ("bonus_vanish",    10, false, [30, 31, 32, 33, 34]);
            this.addAnimation ("bonus_appear",    10, false, [34, 33, 32, 31, 30]);

            // Set a default brick type. This will make sure that this brick
            // is properly visually represented, either by playing the correct
            // animation or by selecting the appropriate sprite.
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