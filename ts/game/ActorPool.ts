module nurdz.game
{
    /**
     * Items stored in the actor pool may optionally provide a property that
     * allows it to store the pool that it is currently contained in. If this
     * property is set, the ActorPool class will adjust it every time the actor
     * is added to a pool.
     */
    export interface ActorPoolClient extends Actor
    {
        /**
         * Optional; if present, it represents the pool that an Actor is
         * currently stored in (which may be null if not in a pool).
         *
         * This property must default to null or some other value (i.e. it
         * cannot be undefined) or the ActorPool will ignore it.
         */
        pool? : ActorPool<Actor>;

        /**
         * Optional; if present, it represents the name associated with this
         * particular client.
         *
         * In ts-game-engine this was originally meant to be a debugging name,
         * but it seems to have turned into a textual name for the class of
         * entity that is being represented.
         *
         * This is here as a reminder that like attribute above, this should be
         * added to the base Actor class directly.
         */
        name? : string;

        /**
         * Optional; if present, invoke "this.pool.killEntity (this)" to kill
         * this entity if possible, or log a warning if the pool us unset.
         *
         * This is here as a reminder that like the attribute above, this should
         * be added to the base Actor class directly.
         */
        kill? () : void;
    }

    /**
     * This class represents an actor pool.
     *
     * The idea is that during the game we will want to construct multiple
     * instances of some of the different types of entities (for example
     * arrows), and we want a way to be able to easily perform the same
     * operation on all of them, such as causing an update.
     *
     * Additionally, between plays we want to be able to re-use these entities
     * to avoid creating more of them.
     *
     * This class allows you to add some number of entities to the list, which
     * are considered "alive", and then redact them from the list of live
     * objects and insert them into the list of dead objects instead.
     */
    export class ActorPool<T extends ActorPoolClient>
    {
        /**
         * This contains the list of entities that have been added to the pool
         * and then marked as "dead", indicating that they are no longer active.
         *
         * When a request for a new entity is made of the pool, it comes out of
         * this array (if possible).
         */
        private _deadPool : Array<T>;

        /**
         * This contains the list of entities that have been added to the pool
         * which are still "alive", indicating that they are still being used.
         *
         * The API methods for obtaining and operating over the list of entities
         * operates over the entities in this part of the pool.
         */
        private _liveContents : Array<T>;

        /**
         * The list of entities in this pool that are currently marked as being
         * alive. These are the entities for which our methods such as update()
         * and render() operate over.
         *
         * @returns {Array<T>} the list of live entities, which may be empty
         */
        get liveEntities () : Array<T>
        { return this._liveContents; }

        /**
         * The list of entities in this pool that are currently marked as being
         * dead. These are the entities available to be resurrected for further
         * use.
         *
         * @returns {Array<T>} the list of dead entities, which may be empty
         */
        get deadEntities () : Array<T>
        { return this._deadPool; }

        /**
         * Create a new empty entity pool.
         */
        constructor ()
        {
            // Create the two pools of entities
            this._deadPool = new Array();
            this._liveContents = new Array ();
        }

        /**
         * Add a new entity to the pool of entities. The state of new entities
         * (alive or dead) is determined by the optional parameter.
         *
         * If the entity provided is already in the list of either live or dead
         * entities, this does nothing.
         *
         * @param {T}       newEntity the entity to add to the live list.
         * @param {boolean} isAlive   true if the entity is added to the live
         * pool, false if it should be added as dead
         */
        addEntity (newEntity : T, isAlive : boolean = true) : void
        {
            // Only add the entity to the live contents if we don't already know
            // about it.
            if (this._deadPool.indexOf (newEntity) == -1 &&
                this._liveContents.indexOf (newEntity) == -1)
            {
                // Store in the appropriate section
                (isAlive ? this._liveContents : this._deadPool).push (newEntity);

                // If possible, tell this entity that it is stored in us. This
                // requires that the (optional) parameter
                if (typeof newEntity.pool != "undefined")
                    newEntity.pool = this;
            }
        }

        /**
         * Mark the entity provided as being dead. This shifts it from the list
         * of live contents to the list of dead contents.
         *
         * When an entity is dead, operations such as updates will not be taken
         * on it. Such entities can be resurrected in order to re-use them
         * later.
         *
         * If the provided entity is already dead or is not in the list of live
         * entities, then nothing happens.
         *
         * @param {T} deadEntity the entity to mark as dead; if this is not
         * an entity already in the live part of the pool, nothing happens.
         */
        killEntity (deadEntity : T) : void
        {
            // Find the index of the entity provided in the list of live
            // entities.
            let liveLocation = this._liveContents.indexOf (deadEntity);

            // If this entity is not already dead and we know that it's alive,
            // then we can kill it.
            if (this._deadPool.indexOf (deadEntity) ==-1 && liveLocation != -1)
            {
                // Push the entity into the dead list, then remove it from the
                // live list using the splice function.
                this._deadPool.push (deadEntity);
                this._liveContents.splice (liveLocation, 1);
            }
        }

        /**
         * Bulk mark all entities in the pool as being dead.
         *
         * If there are no live contents, this harmlessly does nothing.
         */
        killALl () : void
        {
            // If there are any live elements, push them into the dead pool and
            // then remove them from the original array. This uses apply to
            // push all of the elements one after the other (push takes multiple
            // arguments).
            if (this._liveContents.length > 0)
            {
                this._deadPool.push.apply (this._deadPool, this._liveContents);
                this._liveContents.length = 0;
            }
        }

        /**
         * Resurrect a previously dead entity by pulling it from the list of
         * entities that were added to the pool and then marked as dead.
         *
         * If there are no entities to resurrect, this will return null and
         * nothing else happens. Otherwise, the entity is shifted from the dead
         * pool and into the live pool, and is then returned back to you.
         *
         * When this happens, it is up to you to reset the properties in the
         * entity as you see fit, as the entity will emerge in exactly the state
         * it was in when it died.
         *
         * @returns {T|null} the resurrected entity, or null if there is
         */
        resurrectEntity () : T
        {
            // Resurrect a dead entity; if this does not work, return null
            // right away.
            let entity = this._deadPool.pop ();
            if (entity == null)
                return null;

            // Add the entity back to the live list and return it.
            this._liveContents.push (entity);
            return entity;
        }

        /**
         * Perform an update on all entities contained in the pool which are
         * currently marked as being alive.
         *
         * This method can be treated like an invocation of the update() method
         * contained in the Actor class itself.
         *
         * @param {Stage}  stage the stage the entity is on
         * @param {number} tick  the game tick; this is a count of how many
         * times the game loop has executed
         */
        update (stage : Stage, tick : number) : void
        {
            for (let i = 0 ; i < this._liveContents.length ; i++)
                this._liveContents[i].update (stage, tick);
        }

        /**
         * Invoke the render method on all entities contained in the pool which
         * are currently marked as being alive.
         *
         * This will render all living entities by invoking their render method
         * using their current world position (entity.position) and the renderer
         * provided.
         *
         * As such this method is not for use in instances where there is a
         * scrolling view port unless you are modifying the position of
         * everything in the pool as needed.
         *
         * @param {Renderer} renderer the renderer used to do the rendering
         */
        render (renderer : Renderer) : void
        {
            for (let i = 0 ; i < this._liveContents.length ; i++)
            {
                let actor = this._liveContents[i];
                actor.render (actor.position.x, actor.position.y, renderer);
            }
        }
    }
}