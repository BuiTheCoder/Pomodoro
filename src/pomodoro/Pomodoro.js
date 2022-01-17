import React, { useState } from "react";
import classNames from "../utils/class-names";
import useInterval from "../utils/useInterval";
import {minutesToDuration} from "../utils/duration";
import {secondsToDuration} from "../utils/duration";

// These functions are defined outside of the component to insure they do not have access to state
// and are, therefore more likely to be pure.

/**
 * Update the session state with new state after each tick of the interval.
 * @param prevState
 *  the previous session state
 * @returns
 *  new session state with timing information updated.
 */
function nextTick(prevState) {
  const timeRemaining = Math.max(0, prevState.timeRemaining - 1);
  return {
    ...prevState,
    timeRemaining,
  };
}

/**
 * Higher order function that returns a function to update the session state with the next session type upon timeout.
 * @param focusDuration
 *    the current focus duration
 * @param breakDuration
 *    the current break duration
 * @returns
 *  function to update the session state.
 */
function nextSession(focusDuration, breakDuration) {
  /**
   * State function to transition the current session type to the next session. e.g. On Break -> Focusing or Focusing -> On Break
   */
  return (currentSession) => {
    if (currentSession.label === "Focusing") {
      return {
        label: "On Break",
        timeRemaining: breakDuration * 60,
      };
    }
    return {
      label: "Focusing",
      timeRemaining: focusDuration * 60,
    };
  };
}

function Pomodoro() {
    // Timer starts out paused
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    // The current session - null where there is no session running
    const [session, setSession] = useState(null);
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [progressMax, setProgressMax] = useState(0);
    const [progress, setProgress] = useState(0);

    useInterval(
        () => {
            // console.log(session);
            setProgress(secondsScaled(progressMax - session.timeRemaining));
            setProgressMax(
                (session.label === "Focusing") ? (focusDuration * 60) : (breakDuration * 60)
            );

            if (session.timeRemaining === 0) {
                new Audio("https://bigsoundbank.com/UPLOAD/mp3/1482.mp3").play();
                return setSession(nextSession(focusDuration, breakDuration));
            }
            return setSession(nextTick);
        },
        isTimerRunning ? 1000 : null
    );

    /**
    * Called whenever the play/pause button is clicked.
    */
    function playPause() {
        setIsTimerRunning((prevState) => {
            const nextState = !prevState;
            if (nextState) {
                setSession((prevStateSession) => {
                    // If the timer is starting and the previous session is null,
                    // start a focusing session.
                    if (prevStateSession === null) {
                        return {
                            label: "Focusing",
                            timeRemaining: focusDuration * 60,
                        };
                    }
                    return prevStateSession;
                });
            }
            return nextState;
        });
    }

    function stopButton() {
        setIsTimerRunning(false);
        setSession(null);
    }

    function secondsScaled(remaining) {
        return 100 - (progressMax - remaining) / (progressMax) * 100
    }

    // function setFocusDurationValue() {
    //     setFocusDuration(focusDuration - 5)
    // }

  return (
    <div className="pomodoro">
      <div className="row">

        <div className="col">
          <div className="input-group input-group-lg mb-2">
            <span className="input-group-text" data-testid="duration-focus">
              Focus Duration: {minutesToDuration(focusDuration)}
            </span>
            <div className="input-group-append">
              <button
                type="button"
                className="btn btn-secondary"
                data-testid="decrease-focus"
                onClick={() => setFocusDuration(Math.max(focusDuration - 5, 5))}
              >
                <span className="oi oi-minus" />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                data-testid="increase-focus"
                onClick={() => setFocusDuration(Math.min(focusDuration + 5, 60))}
              >
                <span className="oi oi-plus" />
              </button>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="float-right">
            <div className="input-group input-group-lg mb-2">
              <span className="input-group-text" data-testid="duration-break">
                Break Duration: {minutesToDuration(breakDuration)}
              </span>
              <div className="input-group-append">

                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="decrease-break"
                  onClick={() => setBreakDuration(Math.max(breakDuration - 1, 1))}
                >
                  <span className="oi oi-minus" />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="increase-break"
                  onClick={() => setBreakDuration(Math.min(breakDuration + 1, 15))}
                >
                  <span className="oi oi-plus" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div
            className="btn-group btn-group-lg mb-2"
            role="group"
            aria-label="Timer controls"
          >
            <button
              type="button"
              className="btn btn-primary"
              data-testid="play-pause"
              title="Start or pause timer"
              onClick={playPause}
            >
              <span
                className={classNames({
                  oi: true,
                  "oi-media-play": !isTimerRunning,
                  "oi-media-pause": isTimerRunning,
                })}
              />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="stop"
              title="Stop the session"
              onClick={() => stopButton()}
              disabled={session === null}
            >
              <span className="oi oi-media-stop" />
            </button>
          </div>
        </div>
      </div>

      <div>
        {(session !== null) &&
            <div className="row mb-2">
              <div className="col">
                <h2 data-testid="session-title">
                  {session?.label} for {minutesToDuration(
                    (session.label === "Focusing") ? (focusDuration) : (breakDuration)
                  )} minutes
                </h2>
                <p className="lead" data-testid="session-sub-title">
                  {secondsToDuration(session?.timeRemaining)} remaining
                </p>
              </div>
            </div>}


        <div className="row mb-2">
          <div className="col">
            <div
              className="progress"
              style={{
                height: "20px",
              }}
            >
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={progress.toString()}
                // time
                // increases
                style={{ width: `${progress}%` }}

              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;