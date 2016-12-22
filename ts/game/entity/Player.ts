module nurdz.game
{
    /**
     * This is used to indicate what type of player this is. This is just for
     * visual identification on the board.
     */
    export enum PlayerType
    {
        PLAYER_HUMAN,
        PLAYER_COMPUTER,
    }

    /**
     * This is used to indicate what direction this player is facing currently.
     * If the player has been told to switch to a particular facing, it will
     * start reporting that facing right away, even if it's still rotating
     * to face that direction.
     */
    export enum PlayerDirection
    {
        DIRECTION_RIGHT,
        DIRECTION_LEFT,
        DIRECTION_DOWN,
    }

    /**
     * This provides a mapping between the values in the PlayerDirection enum
     * and the character that represents that direction in our animations.
     *
     * This is sensitive to the order of the values in the enumeration, but
     * you'll know when you forgot to fix it though, because everything will
     * look like crap.
     */
    const playerDirectionMap = ["r", "l", "d"];

    /**
     * The entity that represents a player in the game. This is a little man
     * that runs back and forth over the top of the maze that can push balls
     * into the maze to start them off.
     *
     * This entity is used as both the human and computer player (although they
     * are represented by different sprites).
     */
    export class Player extends Entity
    {
        /**
         * The type of this player entity; this influences the animations used
         * for visual looks.
         */
        private _playerType : PlayerType;

        /**
         * The direction this player entity is currently facing (or rotating to
         * face).
         */
        private _playerDirection : PlayerDirection;

        /**
         * This point is the reference for the location that would put us
         * visually into the maze at position (0, -1), the position right above
         * the top left corner.
         */
        private _referencePoint : Point;

        /**
         * True if we are visible on the screen or false if we are currently
         * invisible. We default to visible when we are created, but we can
         * toggle this.
         *
         * When we are invisible, our update() and render() methods take no
         * actions.
         */
        private _visible : boolean;

        /**
         * For an AI player, this value represents the maze entity that is
         * currently in use in the game. This is needed to allow us to apply our
         * last generation AI technology.
         *
         * This value can safely be null for a human Player entity, since it
         * would never be used anyway.
         */
        private _maze : Maze;

        /**
         * In a computer player entity, this represents the column in the maze
         * that represents the ball that they want to attempt to push on this
         * turn.
         *
         * A value of 0 indicates that the computer player is done their turn
         * now and should take no further actions.
         *
         * A value of -1 indicates that the AI is ready to take a new turn and
         * so it should select a column.
         *
         * Any other value indicates the column that the computer is trying to
         * push. This can never be 0 because column 0 in the maze is the side
         * wall, where we can't move to.
         */
        private _aiSelectedColumn : number;

        /**
         * Get the type of the current player; this controls what the player
         * looks like.
         *
         * @returns {PlayerType} the type of player this entity represents
         */
        get playerType () : PlayerType
        { return this._playerType; }

        /**
         * Get the direction that this player is currently facing or rotating
         * to face.
         *
         * @returns {PlayerDirection} the current direction.
         */
        get playerDirection () : PlayerDirection
        { return this._playerDirection; }

        /**
         * Get the reference position that sets us as far left as we can be and
         * still be in bounds of the maze. This is used to calculate our
         * position when it changes.
         *
         * @returns {Point} the current reference position.
         */
        get referencePoint () : Point
        { return this._referencePoint; }

        /**
         * Change the reference position that sets us as far left as we can be
         * and still be in bounds of the maze.
         *
         * When this is set to a new value, our position is automatically
         * recalculated based on this point and our current mapPosition.
         *
         * @param {Point} newPoint the new reference point
         */
        set referencePoint (newPoint : Point)
        {
            this._referencePoint.setTo (newPoint);
            this.updateScreenPosition ();
        }

        /**
         * Get the visibility state of this entity; when the entity is
         * invisible, its update() and render() methods do nothing.
         *
         * @returns {boolean} true to be visible and active or false to be
         * invisible and inactive.
         */
        get visible () : boolean
        { return this._visible; }

        /**
         * Set the visibility state of this entity; when the entity is invisible,
         * its update() and render() methods do nothing
         *
         * @param {boolean} newState the new visibility state to apply
         */
        set visible (newState : boolean)
        { this._visible = newState; }

        /**
         * Get the maze entity that this computer AI controlled Player will use
         * to select its moves. A human controlled player entity ignroes this
         * value.
         *
         * @returns {Maze} the maze currently being used for move selection.
         */
        get maze () : Maze
        { return this._maze; }

        /**
         * Set the maze entity that this computer AI controlled player will use
         * to select its moves. A human controlled player entity ignores this
         * value.
         *
         * @param {Maze} newMaze [description]
         */
        set maze (newMaze : Maze)
        { this._maze = newMaze; }

        /**
         * Construct a new maze cell that will render on the stage provided and
         * which has the entity name provided.
         *
         * This class will automatically set the sprite sheet to the sheet used
         * by all MazeCell subclasses and invoke the setDimensions() method once
         * the preload has completed, at which point dimensions and other
         * handling can be done.
         *
         * @param {Stage}      stage      the stage that we use to render
         * ourselves
         * @param {PlayerType} playerType the type of player entity this should
         * be
         */
        constructor (stage : Stage, playerType : PlayerType)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super ("player", stage, 0, 0, 0, 0, 1, {}, {}, 'blue');

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // The default reference point is the upper left corner of the screen.
            this._referencePoint = new Point (0, 0);

            // We start out visible.
            this._visible = true;

            // Set up animations. There are multiple idle and rotate animations,
            // and a set for the player and human.
            //
            // These follow a strict format so that we can use string formatting
            // to select the appropriate animation easily.

            // Player: Idling facing a given direction.
            this.addAnimation ("p_idle_r", 1, false, [40]);
            this.addAnimation ("p_idle_d", 1, false, [42]);
            this.addAnimation ("p_idle_l", 1, false, [44]);

            // Computer: Idling facing a given direction.
            this.addAnimation ("c_idle_r", 1, false, [50]);
            this.addAnimation ("c_idle_d", 1, false, [52]);
            this.addAnimation ("c_idle_l", 1, false, [54]);

            // Player: Pushing in each direction.
            this.addAnimation ("p_push_r", 15, false, [40, 45, 45, 45, 40]);
            this.addAnimation ("p_push_d", 15, false, [42, 47, 47, 47, 42]);
            this.addAnimation ("p_push_l", 15, false, [44, 49, 49, 49, 44]);

            // Computer: Pushing in each direction.
            this.addAnimation ("c_push_r", 15, false, [50, 55, 55, 55, 50]);
            this.addAnimation ("c_push_d", 15, false, [52, 57, 57, 57, 52]);
            this.addAnimation ("c_push_l", 15, false, [54, 59, 59, 59, 54]);

            // Player: Rotating between all facings.
            this.addAnimation ("p_rotate_r_l", 15, false, [40, 41, 42, 43, 44]);
            this.addAnimation ("p_rotate_l_r", 15, false, [44, 43, 42, 41, 40]);
            this.addAnimation ("p_rotate_r_d", 15, false, [40, 41, 42]);
            this.addAnimation ("p_rotate_l_d", 15, false, [44, 43, 42]);
            this.addAnimation ("p_rotate_d_r", 15, false, [42, 41, 40]);
            this.addAnimation ("p_rotate_d_l", 15, false, [42, 43, 44]);

            // Computer: Rotating between all facings.
            this.addAnimation ("c_rotate_r_l", 15, false, [50, 51, 52, 53, 54]);
            this.addAnimation ("c_rotate_l_r", 15, false, [54, 53, 52, 51, 50]);
            this.addAnimation ("c_rotate_r_d", 15, false, [50, 51, 52]);
            this.addAnimation ("c_rotate_l_d", 15, false, [54, 53, 52]);
            this.addAnimation ("c_rotate_d_r", 15, false, [52, 51, 50]);
            this.addAnimation ("c_rotate_d_l", 15, false, [52, 53, 54]);

            // Save the type given, then set up the correct facing.
            this._playerType = playerType;
            this._playerDirection = PlayerDirection.DIRECTION_RIGHT;

            // If this is a computer player, change the default animation from
            // the one that was automatically selected (the first one added).
            if (playerType == PlayerType.PLAYER_COMPUTER)
                this.playAnimation ("c_idle_r");

            // Set up default AI parameters.
            this._aiSelectedColumn = 0;
            this._maze = null;
        }

        /**
         * This callback is invoked when the preload of our sprite sheet is
         * finished and the image is fully loaded.
         *
         * This allows us to set our dimensions. Position waits until we know
         * the maze has fully loaded all of its images as well so that it knows
         * how to size itself.
         *
         * @param {SpriteSheet} sheet the sprite sheet that was loaded
         */
        private setDimensions = (sheet : SpriteSheet) : void =>
        {
            this.makeRectangle (sheet.width, sheet.height);
        }

        /**
         * Update our screen position based on our currently set reference point
         * and our map position.
         *
         * Only the X value of the map position is used to calculate, since we
         * never actually enter the maze.
         */
        private updateScreenPosition () : void
        {
            this._position.setToXY (this._referencePoint.x +
                                         (this.mapPosition.x * this._width),
                                    this._referencePoint.y);
        }

        /**
         * Update internal state for this pklayer entity.
         *
         * This always invokes the super to do engine housekeeping (such as
         * updating animations), but if we are not visible, no further logic is
         * applied.
         *
         * @param stage the stage that the actor is on
         * @param tick the game tick; this is a count of how many times the game
         * loop has executed
         */
        update (stage : Stage, tick : number) : void
        {
            // Let the super do its job.
            super.update (stage, tick);

            // The remainder of the logic is for the computer player when it is
            // taking a turn. Thus it does not need to execute if this is a
            // human player, the entity is not currently visible, or we are
            // already done with our turn.
            if (this._visible == false || this._playerType == PlayerType.PLAYER_HUMAN ||
                this._aiSelectedColumn == 0)
                return;

            // If there is not a target column for the ball to push yet, then we
            // need to select that right now.
            if (this._aiSelectedColumn == -1)
                this.ai_selectTargetColumn ();

            // There is a target column; if we're not there yet, then take a
            // step towards it. This call will turn the entity in the correct
            // direction and be sure not to take a step until the turn is
            // completed.
            else if (this._aiSelectedColumn != this._mapPosition.x)
                this.ai_stepTowardsTargetBall ();

            // We are at the target column, so turn to face the ball and push
            // it.
            else
                this.ai_pushTargetBall ();
        }

        /**
         * Render this player using the renderer provided. The position given is
         * the position to render on the screen.
         *
         * This will invoke the super version by default, unless we're not
         * visible, in which case it does nothing.
         *
         * @param x the x location to render the actor at, in stage coordinates
         * (NOT world)
         * @param y the y location to render the actor at, in stage coordinates
         * (NOT world)
         * @param renderer the class to use to render the actor
         */
        render (x : number, y : number, renderer : nurdz.game.Renderer) : void
        {
            // If we're visible, let the super render us.
            if (this._visible)
                super.render (x, y, renderer);
        }

        /**
         * Get an indication as to whether the player is capable of pushing at
         * the moment.
         *
         * If this returns false, calling the push () method will have no
         * effect.
         *
         * @returns {boolean} true if the player can push now, false otherwise.
         */
        canPush () : boolean
        {
            // We can only push if we're not currently running any animation.
            return this.animations.isPlaying == false;
        }

       /**
        * Run the animation to push the ball from the current facing.
        *
        * If the player cannot currently push, this does nothing. Otherwise it
        * runs the animation that pushes the ball in the current facing
        * direction of the player.
        *
        * While the push animation is running, no other actions are possible.
         */
        push () : void
        {
            // Leave if we can't push.
            if (this.canPush () == false)
                return;

            // Construct the animation that needs to play to push from the
            // current facing.
            let animation = String.format ("{0}_push_{1}",
                (this._playerType == PlayerType.PLAYER_HUMAN ? "p" : "c"),
                playerDirectionMap[this._playerDirection]);

            // Now play the animation
            this.playAnimation (animation);
        }

        /**
         * Get an indication as to whether the player is capable of turning at
         * the moment.
         *
         * If this returns false, calling the turnTo () method will have no
         * effect.
         *
         * @returns {boolean} true if the player can turn now, false otherwise.
         */
        canTurn () : boolean
        {
            // Can only turn if we're not currently running any animation.
            return this.animations.isPlaying == false;
        }

        /**
         * Turn the player to face the direction given from their current
         * facing.
         *
         * If the player cannot currently turn, this does nothing. Otherwise it
         * runs the animation that rotates the player from their current facing
         * to the one provided.
         *
         * While the turn animation is running, no other actions are possible.
         *
         * @param {PlayerDirection} newDirection the new direction to face in.
         */
        turnTo (newDirection : PlayerDirection) : void
        {
            // If we can't currently turn or the direction to turn to is the
            // direction we're already facing, then just leave and do nothing.
            if (this.canTurn () == false || this._playerDirection == newDirection)
                return;

            // Construct the animation that needs to play to change the facing
            // to the one provided.
            let animation = String.format ("{0}_rotate_{1}_{2}",
                (this._playerType == PlayerType.PLAYER_HUMAN ? "p" : "c"),
                playerDirectionMap[this._playerDirection],
                playerDirectionMap[newDirection]);

            // Now play the animation and change the facing.
            this.playAnimation (animation);
            this._playerDirection = newDirection;
        }

        /**
         * Modify the map location of this player entity by translating the X
         * coordinate by the value provided. Once this is done, the screen
         * position is updated to match the new map position.
         *
         * This method is simple and does not validate that the translation will
         * keep the entity within the correct span of the maze.
         *
         * @param {number} translateX the value to translate by
         */
        moveBy (translateX : number) : void
        {
            this._mapPosition.translateXY (translateX, 0);
            this.updateScreenPosition ();
        }

        /**
         * Jump the position of the player entity on the screen directly to the
         * given absolute column in the maze. Once this is done, the screen position
         * is updated to match the new map position.
         *
         * This method is simple and does not validate that the translation will
         * keep the entity within the correct span of the maze.
         *
         * @param {number} newX the column to jump the player entity to
         */
        jumpTo (newX : number) : void
        {
            this._mapPosition.x = newX;
            this.updateScreenPosition ();
        }

        /**
         * This method is for use when this player entity represents a computer
         * AI player.
         *
         * This is to inform the entity that it is becoming their turn and so on
         * the next call to the update method, we should start our turn.
         */
        ai_startingTurn () : void
        {
            // Indicate that we need to select a column to push on the next
            // update loop.
            this._aiSelectedColumn = -1;
        }

        /**
         * When invoked, this method selects the ball from the current maze
         * layout that it wants to push.
         *
         * This will always select a ball to push, so this should only be
         * invoked when we know that we need to select a new ball.
         */
        private ai_selectTargetColumn () : void
        {
            // Use the AI function to select a ball in the maze.
            //
            // This should always return a valid ball to push (and never null)
            // because we ensure that there is actually a move available prior
            // to switching to the AI turn.
            let ball = AI_selectBestMove (this._maze);
            if (ball == null)
            {
                // Disregard that comment above; this is bad and can conceivably
                // happen because we don't actually perform that check like the
                // comment says we do (yet).
                this._aiSelectedColumn = 0;
                console.log ("AI decided it cannot make a move; this is bad mojo");
                return;
            }

            // Set the target position to the one that is in the ball that
            // we want to push.
            this._aiSelectedColumn = ball.mapPosition.x;
            console.log ("AI selected ball at column " + this._aiSelectedColumn);
        }

        /**
         * When the AI player is not currently at the correct column in the maze
         * to push its target ball, this method should be invoked.
         *
         * It will cause the player to step towards the correct column, making
         * sure that we change our facing as needed first.
         */
        private ai_stepTowardsTargetBall () : void
        {
            // Assume that we want to go left, which is a positional offset of
            // -1.
            let direction = PlayerDirection.DIRECTION_LEFT;
            let offset = -1;

            // If the target map position is larger than  us, we actually want
            // to turn right instead.
            if (this._mapPosition.x < this._aiSelectedColumn)
            {
                direction = PlayerDirection.DIRECTION_RIGHT;
                offset = 1;
            }

            // If we are not currently facing in the correct direction, then we
            // need to turn to that direction.
            if (this._playerDirection != direction)
                this.turnTo (direction);

            // We are facing the right direction, so as long as our animation is
            // not playing we are not still actively turning in that direction,
            // so we can update our position by the proper offset now.
            else if (this.animations.isPlaying == false)
                this.moveBy (offset);
        }

        /**
         * When the AI player is standing in the correct column in the maze to
         * push its target ball, this method should be invoked.
         *
         * It will cause the computer player to turn towards the ball and push
         * it.
         */
        private ai_pushTargetBall () : void
        {
            // If we are not currently facing downards, then we need to face
            // in that direction now.
            if (this._playerDirection != PlayerDirection.DIRECTION_DOWN)
                this.turnTo (PlayerDirection.DIRECTION_DOWN);

            // We are facing downwards, so play our push animation and then
            // get the maze to push the ball.
            else if (this.animations.isPlaying == false)
            {
                this.push ();
                if (this._maze.pushBall (this._aiSelectedColumn))
                    this._aiSelectedColumn = 0;
            }
        }
    }
}