module nurdz.game
{
    /**
     * How many update ticks a lerp should take to move the ball from it's
     * original to final destination. This should be some number smaller than
     * the time it takes a ball to vanish, or it will be gone before it gets
     * there.
     */
    const LERP_DURATION = 5;

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
    export class Ball extends MazeCell implements HideableMazeCell
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
         * Whether this ball is hidden or not.
         *
         * This value only tracks if you use the methods on the Ball entity to
         * vanish or appear it; if you modify it's animation yourself, this will
         * get out of sync.
         *
         * @type {boolean}
         */
        private _hidden : boolean;

        /**
         * The position of this ball in the maze at the time that we invoked the
         * method to save the simulation state; this is the position that is
         * restored when we leave the simulation.
         */
        private _savedPosition : Point;

        /**
         * The score value of this ball at the time that we invoked the method to
         * save the simulation state.
         */
        private _savedScore : number;

        /**
         * When we are told to do a lerp to a new location on the screen, this
         * stores the position that we originally started at.
         */
        private _lerpStartPos : Point;

        /**
         * When we are told to do a lerp to a new location on the screen, this
         * stores the position that we want to ultimately end up at.
         */
        private _lerpEndPos : Point;

        /**
         * When we are doing a lerp, this is the engine tick that the lerp
         * started at. A negative value here indicates that we are not currently
         * trying to do a lerp.
         */
        private _startLerpTick : number;

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
         * Tells you if this ball is hidden or not based on its visual state.
         *
         * This is only an indication of whether the methods in the class have
         * told it to display or not. In particular, if you change the ball
         * animation without using a method in this class, the value here may
         * not track. Additionally, the ball may consider itself hidden while it
         * is still vanishing. If it matters, check if the current animation is
         * playing or not as well.
         *
         * @returns {boolean} true if this ball is currently hidden or false
         * otherwise
         */
        get isHidden () : boolean
        { return this._hidden; }

        /**
         * Return the type of player that owns this ball. This is derived from
         * the current ball type, and is read-only.
         *
         * @returns {PlayerType} the type of player that owns this ball. ball.
         */
        get player () : PlayerType
        {
            if (this._ballType == BallType.BALL_PLAYER)
                return PlayerType.PLAYER_HUMAN;
            return PlayerType.PLAYER_COMPUTER;
        }

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

            // Set up all of the animations that will be used for this entity.
            // There are two sets; one for the player ball and one for the
            // computer ball.
            this.addAnimation ("p_idle",         1, false, [10]);
            this.addAnimation ("p_idle_gone",    1, false, [14]);
            this.addAnimation ("p_vanish",      10, false, [10, 11, 12, 13, 14]);
            this.addAnimation ("p_appear",      10, false, [14, 13, 12, 11, 10]);
            this.addAnimation ("p_score_start", 10, false, [10, 11, 12]);
            this.addAnimation ("p_score_end",   10, false, [12, 12, 12, 13, 14]);

            this.addAnimation ("c_idle",         1, false, [15]);
            this.addAnimation ("c_idle_gone",    1, false, [19]);
            this.addAnimation ("c_vanish",      10, false, [15, 16, 17, 18, 19]);
            this.addAnimation ("c_appear",      10, false, [19, 18, 17, 16, 15]);
            this.addAnimation ("c_score_start", 10, false, [15, 16, 17]);
            this.addAnimation ("c_score_end",   10, false, [17, 17, 17, 18, 19]);

            // The ball is not hidden by default (the first animation in the list
            // is the one that plays by default).
            this._hidden = false;

            // Set the ball type to the value passed in. This will make sure
            // that the ball is properly represented by playing the appropriate
            // idle animation.
            this.ballType = typeOfBall;

            // The ball does not start rolling
            this.moveType = BallMoveType.BALL_MOVE_NONE;

            // Create the point for our saved position during simulations.
            this._savedPosition = new Point (0, 0);
            this._savedScore = 0;

            // No lerp to begin with.
            this._startLerpTick = -1;
        }

        /**
         * Initiate a lerp operation for this ball. The ball will start to move
         * from its current location on the screen to the location provided over
         * a predefined duration time. Once there the lerp will stop.
         *
         * Attempts to modify the ball position manually while the lerp is
         * active will cause visual artifacts because the update loop will be
         * manually updating the position along the way
         *
         * @param {Point} position the final destination location
         */
        lerpTo (position : Point) : void
        {
            // Copy the current and final positions
            this._lerpStartPos = this._position.copy ();
            this._lerpEndPos = position.copy ();

            // Save the current tick so we can time how long this is going for.
            this._startLerpTick = this._stage.tick;
        }

        /**
         * This is called every frame update (tick tells us how many times this
         * has happened) to allow us to update ourselves.
         *
         * This invokes the superclass method, and then makes sure to also
         * invoke the update method for our animated MazeCell entities, so that
         * their animations will play as expected.
         *
         * @param {Stage}  stage the stage that we are on
         * @param {number} tick  the current engine tick; this advances once for
         * each frame update
         */
        update (stage : Stage, tick : number) : void
        {
            // Let the super do it's thing for us.
            super.update (stage, tick);

            // Are we lerping?
            if (this._startLerpTick > 0)
            {
                // Create the normalized value that tells us where along the
                // position line we currently are.
                let lerp = Utils.normalize (tick, this._startLerpTick,
                                                  this._startLerpTick + LERP_DURATION);

                // Now use that value to shift our X and Y values. We make sure
                // to clamp the values down so that we can accurately tell when
                // we're done.
                this._position.x = Math.floor (Utils.linearInterpolate (lerp,
                                     this._lerpStartPos.x, this._lerpEndPos.x));
                this._position.y = Math.floor (Utils.linearInterpolate (lerp,
                                     this._lerpStartPos.y, this._lerpEndPos.y));

                // If we have arrived at the final position, we're done now.
                if (this._position.equals (this._lerpEndPos))
                    this._startLerpTick = -1;
            }
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
            this._hidden = false;
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
            this._hidden = true;
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
            this._hidden = true;
        }

        /**
         * Set the visual state of the ball to a partial vanish; this plays an
         * animation that causes the ball to vanish half way and then stop.
         *
         * This is identical to the vanish state, but the ball ends up not fully
         * vanished (but still considered hidden).
         *
         * This is meant to be paired with scoreEnd() to add the ability to
         * insert an action that happens in the middle of the animation.
         */
        scoreStart () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_score_start"
                : "c_score_start");
            this._hidden = true;
        }

        /**
         * Set the visual state of the ball to the rest of a partial vanish;
         * this plays an animation that causes the ball to finish fully
         * vanishing and then stop.
         *
         * This is identical to the vanish state in that the ball finally ends
         * up fully vanished.
         *
         * This is meant to be paired with scoreStart() to add the ability to
         * insert an action that happens in the middle of the animation.
         */
        scoreEnd () : void
        {
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_score_end"
                : "c_score_end");
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
            this.playAnimation (this._ballType == BallType.BALL_PLAYER
                ? "p_appear"
                : "c_appear");
            this._hidden = false;
        }

        /**
         * Balls only block other balls while they are still visible. This is
         * true whether this is a simulation or not.
         *
         * @param {boolean} isSimulation true if this is part of a simulation,
         * false otherwise
         *
         * @returns {boolean} true if this ball should block the ball or false
         * if the ball should be allowed to pass through it.
         */
        blocksBall (isSimulation : boolean) : boolean
        {
            // If the ball is not hidden, then we block; otherwise we do not.
            return this._hidden == false;
        }

        /**
         * When a ball touches us, we will push it to the left or to the right
         * as long as the last time the ball moved, it was because of a move
         * left or right.
         *
         * This means that for the specific case of a ball moving because it
         * was pushed with an arrow, it will "roll over" us and keep going as
         * if we were an arrow.
         *
         * @param   {Maze}  maze     the maze containing us and the ball
         * @param   {Ball}  ball     the ball that is coliding with us
         * @param   {Point} location the location in the maze that we are at
         *
         * @returns {Point}          the location provided, update to be to the
         * left or right of where it currently sits.
         */
        ballCollision (maze : Maze, ball : Ball, location : Point) : Point
        {
            // Depending on the type of move the ball made last, act
            // accordingly. As long as the ball is trying to drop into us and it
            // was last pushed laterally, keep it moving in that direction.
            switch (ball.moveType)
            {
                case BallMoveType.BALL_MOVE_LEFT:
                    return location.copyTranslatedXY (-1 , 0);

                case BallMoveType.BALL_MOVE_RIGHT:
                    return location.copyTranslatedXY (1 , 0);

                default:
                    return null;
            }
        }

        /**
         * Invoked when we are entering the simulation mode. This saves
         * important state to be restored later.
         */
        enteringSimulation () : void
        {
            // Save our mapPosition and score.
            this._savedPosition.setTo (this._mapPosition);
            this._savedScore = this._score;
        }

        /**
         * Restore saved data that was saved when we entered the simulation.
         */
        exitingSimulation () : void
        {
            this._mapPosition.setTo (this._savedPosition);
            this._score = this._savedScore;
        }
    }
}