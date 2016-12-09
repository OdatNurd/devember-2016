module nurdz.game
{
    /**
     * The entity that represents black holes (teleporters) in the game.
     */
    export class Teleport extends MazeCell
    {
        /**
         * An array of potential teleport destinations that can be accessed from
         * this teleport instance.
         */
        private _destinations : Array<Point>;

        /**
         * Get the destination of this teleport.
         *
         * There can be one or more destinations available from this teleport
         * instance, in which case one of them is randomly selected.
         *
         * If there are no destinations registered, this returns null
         *
         * @returns {Point} the destination of this teleport
         */
        get destination () : Point
        {
            // How we operate depends on how many many destinations we have
            switch (this._destinations.length)
            {
                // No known destinations
                case 0:
                    return null;

                // Exactly one destination
                case 1:
                    return this._destinations[0];

                // Many destinations
                default:
                    return this._destinations[Utils.randomIntInRange
                        (0, this._destinations.length - 1)];
            }
        }

        /**
         * Get the number of destinations registered on this teleport instance.
         *
         * This can be any number >= 0; when it is larger than 1, a destination
         * is randomly selected
         *
         * @returns {number} [description]
         */
        get length () : number
        { return this._destinations.length; }

        /**
         * Construct a new teleport entity that will render on the stage
         * provided.
         *
         * This entity is always in a continuously animated state.
         *
         * @param {Stage} stage the stage that we use to render ourselves
         */
        constructor (stage : Stage)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // our sprites, so we don't set anything here.
            super (stage, "blackHole");

            // Load the sprite sheet that will contain our sprites. The size of
            // the entity is based on the size of the sprites, so we let the
            // callback handle that.
            this._sheet = new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Set up an animation. As this is the first animation, it will play
            // by default.
            this.addAnimation ("idle", 10, true, [35, 36, 37, 38, 39]);

            // Create the list of destinations
            this._destinations = new Array<Point> ();
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
         * Add a potential destination to this teleport instance. This can be
         * invoked more than once, in which case when activated the teleport
         * will randomly select the destination from those provided.
         *
         * This does not verify that the location provided has not already been
         * added; this allows you to bias one destination over another by adding
         * it more than once.
         *
         * @param {Point} location the location to add
         */
        addDestination (location : Point) : void
        {
            this._destinations.push (location.copy ());
        }

        /**
         * Remove all known destinations from this teleport object. This removes
         * its ability to teleport the ball anywhere.
         */
        clearDestinations () : void
        {
            // Throw away all known destinations.
            this._destinations.length = 0;
        }

        /**
         * We don't block the ball because we change its position when it gets
         * on top of us instead of when it touches us.
         *
         * @returns {boolean} always false; the ball is allowed to move through
         * us
         */
        blocksBall () : boolean
        {
            return false;
        }

        /**
         * When the ball is sitting on top of us, we transfer it to a different
         * location in the grid, which has been previously given to us, if
         * possible
         *
         * @param   {Maze}  maze     the maze containing us and the ball
         * @param   {Ball}  ball     the ball that is touching us
         * @param   {Point} location the location in the mazer that we are at
         *
         * @returns {Point}          the potential landing location, if we can
         * find one that is not blocked
         */
        ballTouch (maze : Maze, ball : Ball, location : Point) : Point
        {
            // If there are no destinations stored, we can't teleport, so do
            // nothing.
            if (this.length == 0)
                return null;

            // There are some destinations registered; get one out randomly.
            let newPos = this.destination;

            // As long as the new position is the same as the position that was
            // given to us, select a new position (if possible), so that we
            // don't try to teleport the ball to where it already is.
            while (newPos.equals (location))
            {
                // If there is only a single destination, leave; we can't
                // teleport because the ball is already there.
                if (this.length == 1)
                    return null;

                // Try again.
                newPos = this.destination;
            }

            // Indicate the new position
            return newPos;
        }
    }
}
