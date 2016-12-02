module nurdz.game
{
    /**
     * This is used to specify the two types of arrows in the game.
     *
     * A normal arrow faces some direction and only swaps directions when it is
     * touched. An automatic arrow randomly swaps directions while the ball is
     * dropping, even if it is not touched.
     */
    export enum ArrowType
    {
        ARROW_NORMAL,
        ARROW_AUTOMATIC
    };

    /**
     * This is used to specify the direction that an arrow is currently facing,
     * which represents what direction a ball touching it from above will be
     * pushed.
     *
     * When an arrow changes directions, the direction is instantaneously
     * changed, although the animation may still show it transitioning.
     */
    export enum ArrowDirection
    {
        ARROW_LEFT,
        ARROW_RIGHT
    }

    /**
     * The entity that represents arrows in the game. This covers both style
     * of arrows (the kind that move only when touched by a ball and the kind
     * that randomly swap directions).
     */
    export class Arrow extends MazeCell
    {
        /**
         * The type of arrow that this is (normal or automatic)
         */
        private _arrowType : ArrowType;

        /**
         * The direction that this arrow currently thinks that it is facing.
         */
        private _arrowDirection : ArrowDirection;

        /**
         * Obtain the type of this arrow. This is either a normal arrow, which
         * only swaps its direction when it is touched by a dropping ball, or
         * an automatic ball, which randomly swaps directions.
         *
         * @returns {ArrowType} the type of this arrow
         */
        get arrowType () : ArrowType
        { return this._arrowType; }

        /**
         * Obtain the current facing direction of the arrow. In the case that
         * the arrow is currently in the process of changing its facing visually
         * from one direction to another, this reports what the final direction
         * will be, even if the arrow is still animating.
         *
         * @returns {ArrowDirection} the current facing direction of this arrow
         */
        get arrowDirection () : ArrowDirection
        { return this._arrowDirection; }

        /**
         * Construct a new arrow entity that will render on the stage provided.
         *
         * This entity is always in a continuously animated state, although the
         * animation may be only a single frame.
         *
         * @param {Stage}          stage     the stage that we use to render
         * ourselves
         * @param {ArrowType}      arrowType the type of arrow to create
         * @param {ArrowDirection} direction the direction the arrow is facing
         */
        constructor (stage : Stage, arrowType : ArrowType, direction : ArrowDirection)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (stage, "arrow");

            // Capture the type and direction of the arrow.
            this._arrowType = arrowType;
            this._arrowDirection = direction;

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Set up animations for this entity. We need animations for two
            // different types of entity, so animations are prefixed with 'n'
            // for "normal" arrows and 'a' for "automatically rotating" arrows.
            //
            // We need idle animations for facing in both directions for both
            // types of arrow.
            this.addAnimation ("n_idle_right", 1, false, [20]);
            this.addAnimation ("n_idle_left", 1,  false, [24]);
            this.addAnimation ("a_idle_right", 1, false, [25]);
            this.addAnimation ("a_idle_left", 1,  false, [29]);

            // Now we need animations that swap facing from either right to left
            // or left to right. As above, we need two different versions.
            this.addAnimation ("n_rotate_r_to_l", 10, false, [20, 21, 22, 23, 24]);
            this.addAnimation ("n_rotate_l_to_r", 10, false, [24, 23, 22, 21, 20]);
            this.addAnimation ("a_rotate_r_to_l", 10, false, [25, 26, 27, 28, 29]);
            this.addAnimation ("a_rotate_l_to_r", 10, false, [29, 28, 27, 26, 25]);

            // Based on the type and direction, set the appropriate animation
            // playing. We always start out being idle.
            switch (arrowType)
            {
                case ArrowType.ARROW_NORMAL:
                    this.playAnimation (direction == ArrowDirection.ARROW_LEFT
                        ? "n_idle_left"
                        : "n_idle_right");
                    break;

                case ArrowType.ARROW_AUTOMATIC:
                    this.playAnimation (direction == ArrowDirection.ARROW_LEFT
                        ? "a_idle_left"
                        : "a_idle_right");
                    break;
            }
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

        /**
         * Flip the current direction of this arrow from left to right or vice
         * versa.
         *
         * This will immediately change the internal direction that the arrow
         * thinks that it is pointing, but it will also start the arrow
         * animating towards it's new facing, where it will stop.
         */
        flip () : void
        {
            // Based on the direction that we're currently facing, swap the
            // direction to the other way, and set our animation to rotate to
            // the appropriate location.
            switch (this._arrowDirection)
            {
                case ArrowDirection.ARROW_LEFT:
                    this.playAnimation (this._arrowType == ArrowType.ARROW_NORMAL
                        ? "n_rotate_l_to_r"
                        : "a_rotate_l_to_r");
                    this._arrowDirection = ArrowDirection.ARROW_RIGHT;
                    break;

                case ArrowDirection.ARROW_RIGHT:
                    this.playAnimation (this._arrowType == ArrowType.ARROW_NORMAL
                        ? "n_rotate_r_to_l"
                        : "a_rotate_r_to_l");
                    this._arrowDirection = ArrowDirection.ARROW_LEFT;
                    break;
            }
        }
    }

}
