module nurdz.game
{
    /**
     * This is used to indicate what type of ball this is. This is just for
     * visual identification on the board.
     */
    export enum BallType
    {
        BALL_PLAYER,
        BALL_COMPUTER,
    }

    /**
     * As the ball is being moved through the maze, a value of this type is
     * stored into it to indicate under what circumstances it moved. This allows
     * a ball or other entity to make a decision about how to move the ball
     * based on prior movement.
     *
     * The prime case of this is allowed a ball pushed by an arrow to roll over
     * other stationary balls.
     */
    export enum BallMoveType
    {
        BALL_MOVE_NONE,
        BALL_MOVE_DROP,
        BALL_MOVE_LEFT,
        BALL_MOVE_RIGHT,
        BALL_MOVE_JUMP,
    }

    /**
     * The entity that represents the bricks in the game. These can be used for
     * level geometry or in the actual play area. Some of them are statically
     * displayed while some of them can animate themselves appearing or
     * vanishing away.
     */
    export class Ball extends MazeCell
    {
        /**
         * The type of this ball, which is used to determine the visual look
         * of the ball.
         */
        private _ballType : BallType;

        /**
         * The type of movement that was last made with this ball.
         */
        private _moveType : BallMoveType;

        /**
         * How many points this ball is worth in its current position. The value
         * is 0 before the ball moves and goes up the farther down the screen
         * the ball gets.
         */
        private _score : number;

        /**
         * Get the type of ball that this is; this is used to set a visual
         * representation of the ball
         *
         * @returns {BallType} the current type of the ball
         */
        get ballType () : BallType
        { return this._ballType; }

        /**
         * Set the type of ball that this is; this is used to set a visual
         * representation of the ball.
         *
         * After setting the ball, the animation is set to the appropriate idle
         * animation for this ball based on it's type.
         *
         * @param {BallType} newType the new type of the ball
         */
        set ballType (newType : BallType)
        {
            // Set the type of the ball to the one passed in, then set the
            // ball to idle.
            this._ballType = newType;
            this.idle ();
        }

        /**
         * Get the movement type that was most recently set on this ball. This
         * can be used during movement to influence how an entity moves the
         * ball.
         *
         * @returns {BallMoveType} the last set movement type of this ball
         */
        get moveType () : BallMoveType
        { return this._moveType; }

        /**
         * Change the movement type of this ball to the type passed in; this
         * value can be retreived and used by entities to influence how they
         * operate.
         *
         * @param {BallMoveType} newMoveType the new movement type to set
         */
        set moveType (newMoveType : BallMoveType)
        {
            this._moveType = newMoveType;
        }

        /**
         * Get the current score value set for this ball.
         *
         * @returns {number} the current score value (which may be 0)
         */
        get score () : number
        { return this._score; }

        /**
         * Set the scoring value for this ball.
         *
         * @param {number} newScore the new score for this ball
         */
        set score (newScore : number)
        { this._score = newScore; }


        /**
         * Construct a new ball entity that will render on the stage provided.
         *
         * The ball type provided is used to determine what the ball looks like
         * on the screen.
         *
         * @param {Stage}     stage     the stage that we use to render
         * ourselves
         * @param {ballType} typeOfBall the type of ball entity this should be
         */
        constructor (stage : Stage, typeOfBall : BallType = BallType.BALL_PLAYER)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (stage, "ball");

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Set up all of the animations that will be used for this entity.
            // There are two sets; one for the player ball and one for the
            // computer ball.
            this.addAnimation ("p_idle",       1, false, [10]);
            this.addAnimation ("p_idle_gone",  1, false, [14]);
            this.addAnimation ("p_vanish",    10, false, [10, 11, 12, 13, 14]);
            this.addAnimation ("p_appear",    10, false, [14, 13, 12, 11, 10]);

            this.addAnimation ("c_idle",       1, false, [15]);
            this.addAnimation ("c_idle_gone",  1, false, [19]);
            this.addAnimation ("c_vanish",    10, false, [15, 16, 17, 18, 19]);
            this.addAnimation ("c_appear",    10, false, [19, 18, 17, 16, 15]);

            // Set the ball type to the value passed in. This will make sure
            // that the ball is properly represented by playing the appropriate
            // idle animation.
            this.ballType = typeOfBall;

            // The ball does not start rolling
            this.moveType = BallMoveType.BALL_MOVE_NONE;
        }

        /**
         * This callback is invoked when our sprite sheet finishes loading the
         * underlying image for the sprites. It allows us to set our bounds to
         * be a rectangle at the dimensions of the sprites in the sprite sheet.
         */
        private setDimensions = (sheet : SpriteSheet) : void =>
        {
            // Alter our collision properties; we remain a rectangle even though
            // we are represented by a circular sprite.
            this.makeRectangle (sheet.width, sheet.height);
        }

        /**
         * Set the visual state of the ball to idle; this is the normal state,
         * in which the ball just sits there, looking pretty.
         */
        idle () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_idle"
                : "c_idle");
        }

        /**
         * Set the visual state of the ball to hidden; this is an idle state in
         * which the ball is no longer visible on the screen.
         */
        hide () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_idle_gone"
                : "c_idle_gone");
        }

        /**
         * Set the visual state of the ball to vanish; this plays an animation
         * that causes the ball to vanish from the screen. This is identical to
         * the hidden state (see hide()) but you see the ball vanishing.
         */
        vanish () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_vanish"
                : "c_vanish");
        }

        /**
         * Set the visual state of the ball to appear; this plays an animation
         * that causes the ball to transition from a hidden to idle state. This
         * is identical to the idle state (see idle()) bvut you can see the ball
         * appearing.
         */
        appear () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_appear"
                : "c_appear");
        }
    }
}