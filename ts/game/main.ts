module nurdz.main
{
    // Import the key codes module so that we can easily get at the pressed key
    import KeyCodes = nurdz.game.KeyCodes;

    /**
     * Set up the button on the page to toggle the state of the game.
     *
     * @param stage the stage to control
     * @param buttonID the ID of the button to mark up to control the game state
     */
    function setupButton (stage, buttonID)
    {
        // True when the game is running, false when it is not. This state is toggled by the button. We
        // assume that the game is going to start running.
        var gameRunning = true;

        // Get the button.
        var button = document.getElementById (buttonID);
        if (button == null)
            throw new ReferenceError ("No button found with ID '" + buttonID + "'");

        // Set up the button to toggle the stage.
        button.addEventListener ("click", function ()
        {
            // Try to toggle the game state. This will only throw an error if we try to put the game into
            // a state it is already in, which can only happen if the engine stops itself when we didn't
            // expect it.
            try
            {
                if (gameRunning)
                {
                    stage.muteMusic (true);
                    stage.muteSounds (true);
                    stage.stop ();
                }
                else
                {
                    stage.muteMusic (false);
                    stage.muteSounds (false);
                    stage.run ();
                }
            }

                // Log and then rethrow the error.
            catch (error)
            {
                console.log ("Exception generated while toggling game state");
                throw error;
            }

                // No matter what, toggle the game state. This will put the button back into sync for the next
                // click if it got out of sync.
            finally
            {
                // No matter what, toggle the state.
                gameRunning = !gameRunning;
                button.innerHTML = gameRunning ? "Stop Game" : "Restart Game";
            }
        });
    }

    // Once the DOM is loaded, set things up.
    nurdz.contentLoaded (window, function ()
    {
        try
        {
            // Set up the stage.
            var stage = new game.Stage ('gameContent', 'black',
                window.location.search == "?noscale" ? false : true);

            // Set up the default values used for creating a screen shot.
            game.Stage.screenshotFilenameBase = "devember2016-";
            game.Stage.screenshotWindowTitle = "devember2016-";

            // Set up the button that will stop the game if something goes wrong.
            setupButton (stage, "controlBtn");

            // Register all of our scenes.
            stage.addScene ("game", new game.GameScene (stage));
            stage.addScene ("title", new game.TitleScreen (stage));

            // Switch to the initial scene, add a dot to display and then run the game.
            stage.switchToScene ("title");
            stage.run ();
        }
        catch (error)
        {
            console.log ("Error starting the game");
            throw error;
        }
    });
}
