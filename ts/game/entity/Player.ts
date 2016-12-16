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
         * Construct a new maze cell that will render on the stage provided and
         * which has the entity name provided.
         *
         * This class will automatically set the sprite sheet to the sheet
         * used by all MazeCell subclasses and invoke the setDimensions() method
         * once the preload has completed, at which point dimensions and other
         * handling can be done.
         *
         * @param {Stage}  stage the stage that we use to render ourselves
         */
        constructor (stage : Stage)
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

            // Set up animations. There are multiple idle and rotate animations,
            // and a set for the player and human.
            //
            // These follow a strict format so that we can use string formatting
            // to select the appropriate animation easily.

            // Idling facing a given direction.
            this.addAnimation ("p_idle_r", 1, false, [40]);
            this.addAnimation ("p_idle_d", 1, false, [42]);
            this.addAnimation ("p_idle_l", 1, false, [44]);

            // Pushing in each direction.
            this.addAnimation ("p_push_r", 15, false, [40, 45, 45, 45, 40]);
            this.addAnimation ("p_push_d", 15, false, [42, 47, 47, 47, 42]);
            this.addAnimation ("p_push_l", 15, false, [44, 49, 49, 49, 44]);

            // Rotating between all facings.
            this.addAnimation ("p_rotate_r_l", 15, false, [40, 41, 42, 43, 44]);
            this.addAnimation ("p_rotate_l_r", 15, false, [44, 43, 42, 41, 40]);
            this.addAnimation ("p_rotate_r_d", 15, false, [40, 41, 42]);
            this.addAnimation ("p_rotate_l_d", 15, false, [44, 43, 42]);
            this.addAnimation ("p_rotate_d_r", 15, false, [42, 41, 40]);
            this.addAnimation ("p_rotate_d_l", 15, false, [42, 43, 44]);

            // Default the type and facing.
            this._playerType = PlayerType.PLAYER_HUMAN;
            this._playerDirection = PlayerDirection.DIRECTION_RIGHT;
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
    }
}