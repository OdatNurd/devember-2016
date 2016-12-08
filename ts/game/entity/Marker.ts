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
         * This needs to know the size of the cells in the grid so that it knows
         * how to render itself; this means an instance cannot be created until
         * all of the preloads are finished and we know the cell size.
         *
         * @param {Stage}  stage    the stage that we use to render ourselves
         * @param {number} cellSize the size of the cells (in pixels)
         */
        constructor (stage : Stage, cellSize : number)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Dimensions come from the cell
            // size provided.
            super (stage, "marker");
            this.makeRectangle (cellSize, cellSize);

            // ALl of our rendering is handled by the super class, so all we
            // have to do is set the color we want to render with.
            this._debugColor = 'white';
        }
    }
}
