module nurdz.game
{
    /**
     * This is a simple entity for use during debugging. It can mark a cell in
     * the maze by rendering its bounds.
     */
    export class Marker extends Entity
    {
        /**
         * Construct a new marker entity that will render on the stage provided.
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
            // we're rendered wherever we are needed. We do set our dimensions
            // however.
            super ("marker", stage, 0, 0, cellSize, cellSize, 1, {}, {}, 'white');
        }
    }
}
