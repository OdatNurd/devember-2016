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
    export class Brick extends MazeCell implements HideableMazeCell
    {
        /**
         * The type of this brick, which is used to determine how the player can
         * interact with it, and also specifies how it is represented
         * graphically.
         */
        private _brickType : BrickType;

        /**
         * Whether this ball is hidden or not.
         *
         * This value only tracks if you use the methods on the Ball entity to
         * vanish or appear it; if you modify it's animation yourself, this will
         * get out of sync.
         *
         * @type {boolean}
         */
        private _hidden : boolean;

        private _simulationCollected : boolean;

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
         * Tells you if this brick is hidden or not based on its visual state.
         *
         * This is only an indication of whether the methods in the class have
         * told it to display or not. In particular, if you change the brick
         * animation without using a method in this class, the value here may
         * not track. Additionally, the brick may consider itself hidden while
         * it is still vanishing. If it matters, check if the current animation
         * is playing or not as well.
         *
         * @returns {boolean} true if this brick is currently hidden or false
         * otherwise
         */
        get isHidden () : boolean
        { return this._hidden; }

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

            // Start out not collected in the simulation:
            this._simulationCollected = false;
        }

        /**
         * Set the visual state of the ball to idle; this is the normal state,
         * in which the ball just sits there, looking pretty.
         */
        idle () : void
        {
            this.playAnimation (this._brickType == BrickType.BRICK_GRAY
                ? "gray_idle"
                : "bonus_idle");
            this._hidden = false;
        }

        /**
         * Set the visual state of the ball to hidden; this is an idle state in
         * which the ball is no longer visible on the screen.
         */
        hide () : void
        {
            this.playAnimation (this._brickType == BrickType.BRICK_GRAY
                ? "gray_idle_gone"
                : "bonus_idle_gone");
            this._hidden = true;
        }

        /**
         * Set the visual state of the ball to vanish; this plays an animation
         * that causes the ball to vanish from the screen. This is identical to
         * the hidden state (see hide()) but you see the ball vanishing.
         */
        vanish () : void
        {
            this.playAnimation (this._brickType == BrickType.BRICK_GRAY
                ? "gray_vanish"
                : "bonus_vanish");
            this._hidden = true;
        }

        /**
         * Set the visual state of the ball to appear; this plays an animation
         * that causes the ball to transition from a hidden to idle state. This
         * is identical to the idle state (see idle()) bvut you can see the ball
         * appearing.
         */
        appear () : void
        {
            this.playAnimation (this._brickType == BrickType.BRICK_GRAY
                ? "gray_appear"
                : "bonus_appear");
            this._hidden = false;
        }

        /**
         * The only bricks that block the ball are solid bricks and gray bricks
         * that are still visible on the screen.
         *
         * Gray bricks will only block the ball from moving when this is not a
         * simulation; in a simulation they always act as if they are invisible,
         * to allow for AI to try and guess where the ball will ultimately land.
         *
         * @param {boolean} isSimulation true if this is part of a simulation,
         * false otherwise
         *
         * @returns {boolean} true if this brick should block the brick or false
         * if the ball should be allowed to pass through it.
         */
        blocksBall (isSimulation : boolean) : boolean
        {
            switch (this._brickType)
            {
                // Bonus bricks always allow the ball to pass through.
                case BrickType.BRICK_BONUS:
                    return false;

                // Gray bricks allow the ball to pass through if they have
                // vanished.
                case BrickType.BRICK_GRAY:
                    if (this._hidden)
                        return false;

                    // The brick is still visible; it only blocks when this is
                    // not a simulation; during a simulation it never blocks,
                    // even when visible.
                    return isSimulation == false;

                // Everything else blocks movement.
                default:
                    return true;
            }
        }

        /**
         * For bricks that allow us to enter them, this will get invoked if the
         * ball enters our cell in the maze.
         *
         * This is only true for gray bricks that are gone or for bonus bricks
         * that are still visible. In the case of a bonus brick, this handles
         * the removal of the bonus brick.
         *
         * When isSimulation is true for a bonus brick, instead of vanishing the
         * brick away we update the score of the ball that touched us so that
         * the simulation can track the score change.
         *
         * @param   {Maze}    maze         the maze containing us and the ball
         * @param   {Ball}    ball         the ball that is touching us
         * @param   {Point}   location     the location in the mazer that we are
         * at
         * @param   {boolean} isSimulation true if this is part of a simulation,
         *
         * @returns {Point}          always null; we never move the ball
         */
        ballTouch (maze : Maze, ball : Ball, location : Point, isSimulation : boolean) : Point
        {
            // No matter what, we never want to do anything unless this is a bonus
            // brick; when we pass through gray bricks, we just pass through them.
            if (this._brickType != BrickType.BRICK_BONUS)
                return null;

            // We are not simulating; this is a normal touch.
            if (isSimulation == false)
            {
                // If this bonus brick is visible, then vanish it to consider
                // ourselves collected.
                if (this._hidden == false)
                    this.vanish ();
            }
            else
            {
                // We are simulating, so if we have not already set the flag
                // saying we are collected, update the score in the ball that
                // touched us.
                if (this._simulationCollected == false)
                    ball.score += 10;

                // We are collected now, no matter what.
                this._simulationCollected = true;
            }

            return null;
        }

        /**
         * Invoked when we are entering the simulation mode. This saves
         * important state to be restored later.
         */
        enteringSimulation () : void
        {
            // Our entity (when it is a bonus brick) considers itself already
            // collected when it is hidden or available when it is not. Save
            // that value here. During the simulation, this value will change
            // only.
            this._simulationCollected = this._hidden;
        }

        /**
         * Restore saved data that was saved when we entered the simulation.
         */
        exitingSimulation () : void
        {
            // When we are exiting the simulation, we can set the simulated
            // value the same as we did when we entered the simulation, so that
            // we go back to the state we were in then.
            this.enteringSimulation ();
        }
    }
}