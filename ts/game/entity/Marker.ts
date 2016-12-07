module nurdz.game
{
    /**
     * This is a simple (debug) entity; it is used to debug the tracking for
     * ball progress through the maze by leaving a trail of "bread crumbs".
     */
    export class Marker extends MazeCell
    {
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
        constructor (stage : Stage, maze : Maze)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. We set our dimensions based on
            // the maze provided. Note that this requires that the maze know
            // the cell size, which it can only know after all prelods are
            // compelted.
            super (stage, "marker");
            this.makeRectangle (maze.cellSize, maze.cellSize);

            // ALl of our rendering is handled by the super class, so all we
            // have to do is set the color we want to render with.
            this._debugColor = 'white';
        }

        /**
         * Marker blocks do not block the ball because they're not really there
         * at all, they're just for debugging.
         *
         * @returns {boolean} always false
         */
        blocksBall () : boolean
        {
            return false;
        }
    }
}
