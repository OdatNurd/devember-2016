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
         * Obtain the complete list of current destinations known to this
         * entity.
         *
         * This is an array which can have any number of elements, including 0.
         *
         * @returns {Array<Point>} [description]
         */
        get destinationList () : Array<Point>
        { return this._destinations; }

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

            // Set up an animation. As this is the first animation, it will play
            // by default.
            this.addAnimation ("idle", 10, true, [35, 36, 37, 38, 39]);

            // Create the list of destinations
            this._destinations = new Array<Point> ();
        }

        /**
         * Internal helper; given a point, scan the list of destinations to see
         * if this destination appears anywhere in it. If it does, its index in
         * the desination array is returned; otherwise -1 is returned.
         *
         * @param   {Point}  destination the desintionation to check
         *
         * @returns {number}             the index of the desintation in the
         * list, or -1 if it does not exist.
         */
        private indexOfDestination (destination : Point) : number
        {
            // Simple scan.
            for (let i = 0 ; i < this._destinations.length ; i++)
            {
                if (destination.equals (this._destinations[i]))
                    return i;
            }

            return -1;
        }

        /**
         * Add a potential destination to this teleport instance. This can be
         * invoked more than once, in which case when activated the teleport
         * will randomly select the destination from those provided.
         *
         * If this destination is already in the list, nothing happens.
         *
         * @param {Point} destination the destination to add
         */
        addDestination (destination : Point) : void
        {
            if (this.indexOfDestination (destination) == -1)
                this._destinations.push (destination.copy ());
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
         * Remove a single destination from the list of destinations allowed by
         * this teleport instance.
         *
         * If the destination is not in the list, nothing happens.
         *
         * @param {Point} destination the destination to remove
         */
        clearDestination (destination : Point) : void
        {
            let index = this.indexOfDestination (destination);
            if (index != -1)
                this._destinations.splice (index, 1);
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