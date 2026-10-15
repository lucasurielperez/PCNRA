var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ESCONDIDA2/utils/playground-fake.ts
var playground_fake_exports = {};
__export(playground_fake_exports, {
  FakePlaygroundSDK: () => FakePlaygroundSDK
});
function getRequestedPlayersCount() {
  const requested = Number(
    new URLSearchParams(window.location.search).get("players") ?? "1"
  );
  return Number.isInteger(requested) && requested > 0 ? requested : 1;
}
var FakePlaygroundSDK;
var init_playground_fake = __esm({
  "ESCONDIDA2/utils/playground-fake.ts"() {
    FakePlaygroundSDK = class {
      isInitialized = false;
      onGameEvent = null;
      onPlayerPresence = null;
      onLobbyStatus = null;
      onError = null;
      lobbyId = "fake-lobby-123";
      gameId = "fake-game-456";
      // My local identity (determined dynamically or injected)
      myPlayerId = "player-1";
      isHost = true;
      // The shared players list in the lobby
      players = [];
      channel;
      joinIntervalId = null;
      playersCount = 1;
      constructor() {
        const injectedPlayerId = window.__PLAYER_ID__;
        if (injectedPlayerId) {
          console.log(
            `\u{1F4F1} [Fake SDK] Initializing Player Instance: ${injectedPlayerId}`
          );
          this.myPlayerId = injectedPlayerId;
          this.isHost = injectedPlayerId === "player-1";
          this.channel = new BroadcastChannel(`playground-lobby-${this.lobbyId}`);
          this.channel.onmessage = (event) => this._handleChannelMessage(event.data);
        } else {
          console.log(
            "\u{1F4F1} [Fake SDK] Initializing Split-Screen Container Manager..."
          );
        }
      }
      /**
       * Initializes the SDK.
       */
      async init(onGameEvent, onPlayerPresence, onLobbyStatus, onError) {
        if (this.isInitialized) {
          console.warn("\u26A0\uFE0F [Fake SDK] Already initialized.");
          throw new Error("SDK is already initialized.");
        }
        const injectedPlayerId = window.__PLAYER_ID__;
        if (!injectedPlayerId) {
          if (this._isSplitScreenEnabled()) {
            console.log(
              "\u{1F4F1} [Fake SDK] Split-screen container active. Orchestrating viewports..."
            );
            this._setupSplitScreen();
            return new Promise(() => {
            });
          }
          console.log(
            "\u{1F4F1} [Fake SDK] Single-player game detected. Running as solo host (no split-screen)."
          );
        }
        this.onGameEvent = onGameEvent;
        this.onPlayerPresence = onPlayerPresence;
        if (onLobbyStatus) this.onLobbyStatus = onLobbyStatus;
        if (onError) this.onError = onError;
        this.isInitialized = true;
        const injectedPlayersCount = window.__PLAYERS_COUNT__ || 1;
        this.playersCount = injectedPlayersCount;
        console.log(
          `\u{1F680} [Fake SDK] Player ${this.myPlayerId} of ${this.playersCount} initialized.`
        );
        window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
        if (this.isHost) {
          this.players = [
            this._createPlayer("player-1", "Player 1 (Host)", true, true)
          ];
          for (let i = 2; i <= this.playersCount; i++) {
            this.players.push(
              this._createPlayer(
                `player-${i}`,
                `Player ${i} (Waiting...)`,
                false,
                false
              )
            );
          }
          for (const p of this.players) {
            this._triggerPresence("JOIN", p);
          }
        } else {
          const playerIndex = this.myPlayerId.split("-")[1];
          console.log(
            `\u{1F4E1} [Fake SDK] Player ${playerIndex} starting connection handshake...`
          );
          this.joinIntervalId = setInterval(() => {
            console.log(`\u{1F4E1} [Fake SDK] Player ${playerIndex} pinging Host...`);
            this._broadcast({
              type: "PLAYER_JOINED_REQUEST",
              playerId: this.myPlayerId
            });
          }, 300);
        }
      }
      /**
       * Simulates lobby creation (for the Host).
       */
      createLobby(callback) {
        console.log("\u{1F4DD} [Fake SDK] createLobby called.");
        const lobbyInfo = this._getLobbyInfo("WAITING_FOR_PLAYERS");
        setTimeout(() => callback(lobbyInfo), 100);
      }
      /**
       * Simulates fetching lobby info.
       */
      getLobby(arg1, arg2) {
        let callback;
        let lobbyId;
        if (typeof arg1 === "function") {
          callback = arg1;
          lobbyId = arg2;
        } else {
          lobbyId = arg1;
          callback = arg2;
        }
        console.log(`\u{1F50D} [Fake SDK] getLobby called.`);
        const lobbyInfo = this._getLobbyInfo(
          this.players.length >= 2 ? "GAME_IN_PROGRESS" : "WAITING_FOR_PLAYERS"
        );
        if (typeof callback === "function") {
          setTimeout(() => callback(lobbyInfo), 100);
        }
      }
      /**
       * Simulates presence updates. Supports dynamic argument signatures and optional callbacks.
       */
      updatePlayerPresence(arg1, arg2, arg3) {
        let action = "JOIN";
        let callback;
        if (typeof arg1 === "string") {
          action = arg1;
          if (typeof arg2 === "function") callback = arg2;
          else if (typeof arg3 === "function") callback = arg3;
        } else if (typeof arg1 === "function") {
          callback = arg1;
        }
        console.log(`\u{1F464} [Fake SDK] updatePlayerPresence: ${action}`);
        if (typeof callback === "function") {
          setTimeout(() => callback(true), 100);
        }
      }
      /**
       * Starts the game.
       */
      startGame(lobbyId) {
        console.log(`\u{1F3AC} [Fake SDK] startGame called.`);
        this._broadcast({
          type: "START_GAME",
          lobbyId: this.lobbyId
        });
        this._triggerLobbyStatus("GAME_IN_PROGRESS");
      }
      /**
       * Broadcasts game events to the other iframe.
       */
      sendGameEvent(eventData) {
        console.log("\u{1F4E4} [Fake SDK] Sending game event:", eventData);
        this._broadcast({
          type: "GAME_EVENT",
          event: eventData,
          from: this.myPlayerId
        });
      }
      scoreUpdated(scoreData) {
        console.log("\u{1F3C6} [Fake SDK] scoreUpdated:", scoreData);
        const me = this.players.find((p) => p.playerId === this.myPlayerId);
        if (me) {
          me.score = scoreData.value || 0;
        }
        this._broadcast({
          type: "SCORE_UPDATED",
          playerId: this.myPlayerId,
          scoreData
        });
      }
      levelComplete(level) {
        console.log(`\u2B50 [Fake SDK] levelComplete: Level ${level}`);
        this._broadcast({ type: "LEVEL_COMPLETE", level });
      }
      gameOver(lobbyId) {
        console.log(`\u{1F6D1} [Fake SDK] gameOver called.`);
        this._broadcast({ type: "GAME_OVER", lobbyId });
        this._triggerLobbyStatus("GAME_ENDED");
        this._showMockLeaderboard();
      }
      pauseStateChanged(isPaused) {
        console.log(`\u23F8\uFE0F [Fake SDK] pauseStateChanged: isPaused=${isPaused}`);
        this._broadcast({ type: "PAUSE_STATE_CHANGED", isPaused });
      }
      _showMockLeaderboard() {
        if (document.getElementById("mock-leaderboard-overlay")) return;
        const overlay = document.createElement("div");
        overlay.id = "mock-leaderboard-overlay";
        Object.assign(overlay.style, {
          position: "fixed",
          inset: "0",
          backgroundColor: "rgba(10, 10, 12, 0.95)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "100000",
          color: "#ffffff",
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: "20px"
        });
        const card = document.createElement("div");
        Object.assign(card.style, {
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "24px",
          padding: "32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(6, 182, 212, 0.15)",
          textAlign: "center",
          position: "relative"
        });
        const title = document.createElement("h2");
        title.innerText = "\u{1F3C6} Global Leaderboard";
        Object.assign(title.style, {
          margin: "0 0 8px 0",
          fontSize: "24px",
          fontWeight: "900",
          background: "linear-gradient(to right, #facc15, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textTransform: "uppercase",
          letterSpacing: "1.5px"
        });
        card.appendChild(title);
        const subtitle = document.createElement("p");
        subtitle.innerText = "Playground SDK - Local Simulation";
        Object.assign(subtitle.style, {
          margin: "0 0 24px 0",
          fontSize: "11px",
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontWeight: "700"
        });
        card.appendChild(subtitle);
        const list = document.createElement("div");
        Object.assign(list.style, {
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "28px"
        });
        const sortedPlayers = [...this.players].sort(
          (a, b) => (b.score || 0) - (a.score || 0)
        );
        const realPlayers = sortedPlayers.map((p, idx) => {
          let rankLabel = `${idx + 1}`;
          if (idx === 0) rankLabel = `\u{1F947} 1`;
          else if (idx === 1) rankLabel = `\u{1F948} 2`;
          else if (idx === 2) rankLabel = `\u{1F949} 3`;
          let displayName = p.displayName;
          if (displayName.includes("Waiting")) {
            displayName = p.playerId === "player-1" ? "Player 1 (Host)" : "Player 2 (Guest)";
          }
          return {
            rank: rankLabel,
            name: displayName,
            score: `${p.score || 0} pts`,
            active: p.playerId === this.myPlayerId
          };
        });
        const leaderboardData = [...realPlayers];
        const lastRealScore = sortedPlayers.length > 0 ? sortedPlayers[sortedPlayers.length - 1].score || 0 : 0;
        const mockGlobal = [
          { name: "Spectator_Alpha", scoreOffset: -100 },
          { name: "Casual_Gamer", scoreOffset: -250 },
          { name: "Speedrunner_99", scoreOffset: -400 }
        ];
        mockGlobal.forEach((mock) => {
          const rank = leaderboardData.length + 1;
          let rankLabel = `${rank}`;
          if (rank === 2) rankLabel = `\u{1F948} 2`;
          else if (rank === 3) rankLabel = `\u{1F949} 3`;
          const mockScore = Math.max(0, lastRealScore + mock.scoreOffset);
          leaderboardData.push({
            rank: rankLabel,
            name: mock.name,
            score: `${mockScore} pts`,
            active: false
          });
        });
        leaderboardData.forEach((p) => {
          const row = document.createElement("div");
          Object.assign(row.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: p.active ? "rgba(6, 182, 212, 0.08)" : "#09090b",
            border: p.active ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid #27272a",
            borderRadius: "12px",
            fontSize: "14px"
          });
          const playerInfo = document.createElement("div");
          Object.assign(playerInfo.style, {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontWeight: p.active ? "700" : "500",
            color: p.active ? "#22d3ee" : "#e4e4e7"
          });
          const rankSpan = document.createElement("span");
          rankSpan.innerText = p.rank;
          Object.assign(rankSpan.style, {
            fontFamily: "monospace",
            minWidth: "24px"
          });
          playerInfo.appendChild(rankSpan);
          const nameSpan = document.createElement("span");
          nameSpan.innerText = p.name;
          playerInfo.appendChild(nameSpan);
          row.appendChild(playerInfo);
          const scoreSpan = document.createElement("span");
          scoreSpan.innerText = p.score;
          Object.assign(scoreSpan.style, {
            fontWeight: "900",
            fontFamily: "monospace",
            color: p.active ? "#22d3ee" : "#a1a1aa"
          });
          row.appendChild(scoreSpan);
          list.appendChild(row);
        });
        card.appendChild(list);
        const closeBtn = document.createElement("button");
        closeBtn.innerText = "Dismiss Leaderboard";
        Object.assign(closeBtn.style, {
          width: "100%",
          padding: "12px 0",
          backgroundColor: "#27272a",
          border: "none",
          borderRadius: "12px",
          color: "#ffffff",
          fontWeight: "700",
          fontSize: "13px",
          cursor: "pointer",
          transition: "all 0.15s ease-in-out"
        });
        closeBtn.onclick = () => {
          overlay.remove();
        };
        card.appendChild(closeBtn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
      }
      showLeaderboard(lobbyId) {
        console.log(`\u{1F4CA} [Fake SDK] showLeaderboard called.`);
      }
      // --- Split Screen Orchestration ---
      /**
       * Split-screen (multi-viewport) orchestration is only meaningful for
       * multiplayer games. It must be opted into explicitly, either by the
       * multiplayer SDK hook (`window.__PLAYGROUND_MULTIPLAYER__ = true`) or via
       * `?players=N` (N > 1) for local testing. Single-player games must never be
       * hijacked by it.
       */
      _isSplitScreenEnabled() {
        if (window.__PLAYGROUND_MULTIPLAYER__ === true) {
          return true;
        }
        return getRequestedPlayersCount() > 1;
      }
      _setupSplitScreen() {
        const html = document.documentElement.outerHTML;
        const playersCount = getRequestedPlayersCount();
        const maxPlayers = 4;
        console.log(
          `\u{1F4F1} [Fake SDK] Setting up dashboard for ${playersCount} players (max ${maxPlayers})...`
        );
        document.body.innerHTML = "";
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.backgroundColor = "#111";
        const container = document.createElement("div");
        container.style.display = "grid";
        container.style.height = "100vh";
        container.style.width = "100vw";
        container.style.gap = "2px";
        container.style.backgroundColor = "#222";
        const updateGridLayout = (count) => {
          if (count <= 1) {
            container.style.gridTemplateColumns = "1fr";
            container.style.gridTemplateRows = "1fr";
          } else if (count === 2) {
            container.style.gridTemplateColumns = "1fr";
            container.style.gridTemplateRows = "1fr 1fr";
          } else {
            container.style.gridTemplateColumns = "1fr 1fr";
            container.style.gridTemplateRows = `repeat(${Math.ceil(
              count / 2
            )}, 1fr)`;
          }
        };
        updateGridLayout(playersCount);
        const iframes = [];
        const injectGlobals = (htmlStr, playerId, totalPlayers) => {
          return htmlStr.replace(
            "<head>",
            `<head><script>
          window.__PLAYER_ID__="${playerId}";
          window.__PLAYERS_COUNT__=${totalPlayers};
        <\/script>`
          );
        };
        const spawnPlayerIframe = (playerId, totalPlayers) => {
          const iframe = document.createElement("iframe");
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.margin = "0";
          iframe.style.padding = "0";
          iframe.style.overflow = "hidden";
          iframe.style.backgroundColor = "#000";
          return iframe;
        };
        const hostIframe = spawnPlayerIframe("player-1", playersCount);
        container.appendChild(hostIframe);
        iframes.push(hostIframe);
        document.body.appendChild(container);
        console.log("\u{1F4F1} [Fake SDK] Loading Player 1 (Host) immediately...");
        hostIframe.srcdoc = injectGlobals(html, "player-1", playersCount);
        let watchdogTimer = null;
        let gameStarted = false;
        let isParentChannelClosed = false;
        const parentChannel = new BroadcastChannel(
          `playground-lobby-${this.lobbyId}`
        );
        const checkAndCloseChannel = () => {
          if (!isParentChannelClosed && gameStarted && iframes.length >= maxPlayers) {
            console.log("\u{1F4F1} [Fake SDK] Parent channel closed.");
            parentChannel.close();
            isParentChannelClosed = true;
          }
        };
        parentChannel.onmessage = (event) => {
          if (event.data && event.data.type === "START_GAME") {
            console.log(
              "\u{1F4F1} [Fake SDK] Parent detected GAME_STARTED. Clearing watchdog."
            );
            gameStarted = true;
            if (watchdogTimer) {
              clearTimeout(watchdogTimer);
              watchdogTimer = null;
            }
            checkAndCloseChannel();
          }
        };
        const startWatchdog = (totalCount) => {
          if (gameStarted) return;
          if (watchdogTimer) clearTimeout(watchdogTimer);
          watchdogTimer = setTimeout(() => {
            if (!gameStarted) {
              console.warn(
                "\u26A0\uFE0F [Fake SDK] Some players stuck connecting! Reloading all Guest iframes..."
              );
              for (let i = 2; i <= totalCount; i++) {
                if (iframes[i - 1]) {
                  iframes[i - 1].srcdoc = injectGlobals(
                    html,
                    `player-${i}`,
                    totalCount
                  );
                }
              }
              startWatchdog(totalCount);
            }
          }, 4e3);
        };
        if (playersCount > 1) {
          setTimeout(() => {
            console.log(
              `\u{1F4F1} [Fake SDK] Loading ${playersCount - 1} Guest players after delay...`
            );
            for (let i = 2; i <= playersCount; i++) {
              const guestIframe = spawnPlayerIframe(`player-${i}`, playersCount);
              container.appendChild(guestIframe);
              iframes.push(guestIframe);
              guestIframe.srcdoc = injectGlobals(html, `player-${i}`, playersCount);
            }
            startWatchdog(playersCount);
          }, 500);
        }
        const btn = document.createElement("button");
        btn.innerText = "\u2795 Add Guest Player";
        btn.style.position = "fixed";
        btn.style.top = "50%";
        btn.style.left = "50%";
        btn.style.transform = "translate(-50%, -50%)";
        btn.style.padding = "12px 24px";
        btn.style.backgroundColor = "#0f9d58";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "24px";
        btn.style.fontFamily = "sans-serif";
        btn.style.fontWeight = "bold";
        btn.style.fontSize = "14px";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4)";
        btn.style.zIndex = "99999";
        btn.style.transition = "all 0.2s ease";
        const lockButtonActive = () => {
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.style.cursor = "not-allowed";
          btn.style.backgroundColor = "#555";
          btn.innerText = "\u{1F512} Split Screen Active";
        };
        if (playersCount >= maxPlayers) {
          lockButtonActive();
        }
        btn.onmouseenter = () => {
          if (btn.disabled) return;
          btn.style.transform = "translate(-50%, -50%) scale(1.05)";
          btn.style.backgroundColor = "#0b8043";
        };
        btn.onmouseleave = () => {
          if (btn.disabled) return;
          btn.style.transform = "translate(-50%, -50%) scale(1)";
          btn.style.backgroundColor = "#0f9d58";
        };
        btn.onclick = () => {
          const nextPlayerIndex = iframes.length + 1;
          if (nextPlayerIndex > maxPlayers) {
            return;
          }
          console.log(
            `\u{1F4F1} [Fake SDK] Dynamically adding Player ${nextPlayerIndex}...`
          );
          const newCount = nextPlayerIndex;
          if (newCount >= maxPlayers) {
            lockButtonActive();
          }
          updateGridLayout(newCount);
          const newIframe = spawnPlayerIframe(`player-${newCount}`, newCount);
          container.appendChild(newIframe);
          iframes.push(newIframe);
          parentChannel.postMessage({
            type: "ADD_PLAYER_SLOT",
            totalPlayers: newCount
          });
          setTimeout(() => {
            newIframe.srcdoc = injectGlobals(html, `player-${newCount}`, newCount);
          }, 100);
          startWatchdog(newCount);
          checkAndCloseChannel();
        };
        document.body.appendChild(btn);
      }
      // --- Private Helpers ---
      _createPlayer(id, name, isCurrent, isHost, score = 0) {
        return {
          playerId: id,
          displayName: name,
          avatarUrl: id === "player-1" ? "https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-64dp/logo_avatar_anonymous_color_64dp.png" : "https://fonts.gstatic.com/s/i/productlogos/android/v6/web-64dp/logo_android_color_64dp.png",
          isCurrentPlayer: isCurrent,
          isHost,
          score
        };
      }
      _getLobbyInfo(state) {
        const mappedPlayers = this.players.map((p) => ({
          ...p,
          isCurrentPlayer: p.playerId === this.myPlayerId
        }));
        return {
          lobbyId: this.lobbyId,
          gameId: this.gameId,
          minPlayers: this.playersCount,
          maxPlayers: this.playersCount,
          state,
          status: state,
          players: mappedPlayers
        };
      }
      _broadcast(data) {
        if (this.channel) {
          this.channel.postMessage(data);
        }
      }
      _handleChannelMessage(data) {
        if (!data || !data.type) return;
        switch (data.type) {
          case "ADD_PLAYER_SLOT":
            const newTotal = data.totalPlayers;
            console.log(
              `\u2795 [Fake SDK] Host received ADD_PLAYER_SLOT. Updating total players to ${newTotal}`
            );
            this.playersCount = newTotal;
            const newPlayerId = `player-${newTotal}`;
            if (!this.players.some((p) => p.playerId === newPlayerId)) {
              const newPlayer = this._createPlayer(
                newPlayerId,
                `Player ${newTotal} (Waiting...)`,
                false,
                false
              );
              this.players.push(newPlayer);
              this._triggerPresence("JOIN", newPlayer);
              this._broadcast({
                type: "LOBBY_UPDATED",
                players: this.players
              });
            }
            break;
          case "PLAYER_JOINED_REQUEST":
            if (this.isHost) {
              const guestId = data.playerId;
              const guestNum = guestId.split("-")[1];
              console.log(`\u{1F464} [Fake SDK] Guest ${guestId} connected.`);
              const guest = this.players.find((p) => p.playerId === guestId);
              if (guest && guest.displayName.includes("Waiting")) {
                guest.displayName = `Player ${guestNum} (Active)`;
                this._broadcast({
                  type: "LOBBY_UPDATED",
                  players: this.players
                });
                this._triggerPresence("JOIN", guest);
                const allActive = this.players.every(
                  (p) => !p.displayName.includes("Waiting")
                );
                if (allActive) {
                  console.log(
                    "\u{1F680} [Fake SDK] All players active. Autostarting game..."
                  );
                  setTimeout(() => this.startGame(), 500);
                }
              }
            }
            break;
          case "LOBBY_UPDATED":
            if (!this.isHost) {
              console.log("\u{1F4DD} [Fake SDK] Lobby updated from host:", data.players);
              this.players = data.players;
              if (this.joinIntervalId) {
                const me = this.players.find((p) => p.playerId === this.myPlayerId);
                if (me && !me.displayName.includes("Waiting")) {
                  const guestNum = this.myPlayerId.split("-")[1];
                  console.log(
                    `\u{1F4E1} [Fake SDK] Player ${guestNum} connection successful. Stopping pings.`
                  );
                  clearInterval(this.joinIntervalId);
                  this.joinIntervalId = null;
                }
              }
              const meInLobby = this.players.find(
                (p) => p.playerId === this.myPlayerId
              );
              if (meInLobby) this._triggerPresence("JOIN", meInLobby);
            }
            break;
          case "START_GAME":
            if (!this.isHost) {
              console.log("\u{1F3AC} [Fake SDK] Received start game signal.");
              if (this.joinIntervalId) {
                clearInterval(this.joinIntervalId);
                this.joinIntervalId = null;
              }
              this._triggerLobbyStatus("GAME_IN_PROGRESS");
            }
            break;
          case "GAME_EVENT":
            if (data.from !== this.myPlayerId) {
              console.log(
                "\u{1F4E5} [Fake SDK] Received game event from opponent:",
                data.event
              );
              if (this.onGameEvent) {
                this.onGameEvent(data.event);
              }
            }
            break;
          case "SCORE_UPDATED":
            console.log("\u{1F3C6} [Fake SDK] Opponent score updated:", data.scoreData);
            const playerToUpdate = this.players.find(
              (p) => p.playerId === data.playerId
            );
            if (playerToUpdate) {
              playerToUpdate.score = data.scoreData.value || 0;
              console.log(
                `\u{1F4DD} [Fake SDK] Synchronized ${data.playerId} score to ${playerToUpdate.score}`
              );
            }
            break;
          case "LEVEL_COMPLETE":
            console.log(`\u2B50 [Fake SDK] Opponent completed level: ${data.level}`);
            break;
          case "PAUSE_STATE_CHANGED":
            console.log(
              `\u23F8\uFE0F [Fake SDK] Peer pause state changed: isPaused=${data.isPaused}`
            );
            break;
          case "GAME_OVER":
            console.log("\u{1F6D1} [Fake SDK] Received game over signal.");
            this._triggerLobbyStatus("GAME_ENDED");
            this._showMockLeaderboard();
            break;
        }
      }
      _triggerPresence(action, player) {
        if (this.onPlayerPresence) {
          const mappedPlayer = {
            ...player,
            isCurrentPlayer: player.playerId === this.myPlayerId
          };
          this.onPlayerPresence({
            action,
            status: "SUCCESS",
            player: mappedPlayer
          });
        }
      }
      _triggerLobbyStatus(status) {
        if (this.onLobbyStatus) {
          this.onLobbyStatus({
            status,
            lobbyId: this.lobbyId
          });
        }
      }
    };
  }
});

// ESCONDIDA2/index.tsx
import { createRoot } from "react-dom/client";

// ESCONDIDA2/App.tsx
import { useCallback as useCallback2, useEffect as useEffect4, useRef as useRef4, useState as useState4 } from "react";
import {
  Play,
  RotateCw,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  Check,
  Sparkles,
  Trophy,
  ArrowRight,
  Eye,
  Sliders,
  Home,
  Music,
  Snowflake
} from "lucide-react";

// ESCONDIDA2/constants.ts
var THEME = {
  fontFamily: "'Fredoka', 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
  primaryColor: "#f59e0b",
  secondaryColor: "#3b82f6",
  accentGreen: "#10b981",
  accentPink: "#ec4899",
  cardBg: "#1e293b",
  boardBg: "#0f172a",
  borderRadius: "1.25rem"
};
var CONFIG = {
  // --- Game Metadata ---
  title: {
    value: "Escondite Cubo",
    type: "string",
    label: "Game Title",
    group: "GAME"
  },
  baseCanvasWidth: {
    value: 1376,
    type: "number",
    label: "Base Canvas Width",
    group: "GAME"
  },
  baseCanvasHeight: {
    value: 768,
    type: "number",
    label: "Base Canvas Height",
    group: "GAME"
  },
  // --- System Constants for Stepper ---
  targetFPS: {
    value: 60,
    type: "number",
    label: "Target FPS",
    group: "SYSTEM"
  },
  stepMs: {
    value: 1e3 / 60,
    type: "number",
    label: "Step MS",
    group: "SYSTEM"
  },
  maxSubSteps: {
    value: 5,
    type: "number",
    label: "Max Sub Steps",
    group: "SYSTEM"
  },
  // --- Gameplay Rules & Tuning ---
  roundObjectCount: {
    value: 4,
    type: "number",
    label: "Objects per Round",
    group: "Rules"
  },
  peekIntervalSeconds: {
    value: 3,
    type: "number",
    label: "Peek Interval (Seconds)",
    group: "Rules"
  },
  clueDelaySeconds: {
    value: 10,
    type: "number",
    label: "Clue Delay (Seconds)",
    group: "Rules"
  },
  characterSpeed: {
    value: 380,
    type: "number",
    label: "Character Run Speed",
    group: "Rules"
  },
  freezeCooldownSeconds: {
    value: 5,
    type: "number",
    label: "Freeze Cooldown (Seconds)",
    group: "Rules"
  },
  pointsPerFind: {
    value: 100,
    type: "number",
    label: "Points per Round",
    group: "Rules"
  },
  enablePeeking: {
    value: true,
    type: "boolean",
    label: "Enable Character Peeking",
    group: "Rules"
  },
  // --- Audio Settings ---
  defaultMusicVolume: {
    value: 0.5,
    type: "number",
    label: "Default Music Volume",
    group: "AUDIO"
  },
  defaultSfxVolume: {
    value: 0.7,
    type: "number",
    label: "Default SFX Volume",
    group: "AUDIO"
  },
  // --- Theme / Visuals ---
  backgroundColor: {
    value: "#7dd3fc",
    type: "color",
    label: "Sky Fallback Color",
    group: "THEME"
  },
  primaryColor: {
    value: "#f59e0b",
    type: "color",
    label: "Primary Accent Color",
    group: "THEME"
  },
  fontFamily: {
    value: "'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif",
    type: "string",
    label: "Font Family",
    group: "THEME"
  },
  // --- Asset Dimensions & Aspect Ratios (from read_assets_metadata) ---
  bgPlayfieldAspectRatio: {
    value: 1.791666667,
    // 1376x768
    type: "number",
    label: "Playfield BG Aspect Ratio",
    group: "ASSETS"
  },
  bgPlayfieldWidth: {
    value: 1376,
    type: "number",
    label: "Playfield BG Width",
    group: "ASSETS"
  },
  bgPlayfieldHeight: {
    value: 768,
    type: "number",
    label: "Playfield BG Height",
    group: "ASSETS"
  },
  // Objects Aspect Ratios
  objBrickHouseAspectRatio: {
    value: 0.97687,
    // 718x735
    type: "number",
    label: "Brick House Aspect Ratio",
    group: "ASSETS"
  },
  objToyRocketAspectRatio: {
    value: 1.05735,
    // 719x680
    type: "number",
    label: "Toy Rocket Aspect Ratio",
    group: "ASSETS"
  },
  objHayBaleAspectRatio: {
    value: 1.00764,
    // 791x785
    type: "number",
    label: "Hay Bale Aspect Ratio",
    group: "ASSETS"
  },
  objCampingTentAspectRatio: {
    value: 1.2276,
    // 836x681
    type: "number",
    label: "Camping Tent Aspect Ratio",
    group: "ASSETS"
  },
  objGiantMushroomAspectRatio: {
    value: 0.9576,
    // 746x779
    type: "number",
    label: "Giant Mushroom Aspect Ratio",
    group: "ASSETS"
  },
  objToyChestAspectRatio: {
    value: 1.03596,
    // 749x723
    type: "number",
    label: "Toy Chest Aspect Ratio",
    group: "ASSETS"
  },
  objEnchantedTreeAspectRatio: {
    value: 0.7617,
    // 617x810
    type: "number",
    label: "Enchanted Tree Aspect Ratio",
    group: "ASSETS"
  },
  objWoodenBarrelAspectRatio: {
    value: 0.8128,
    // 595x732
    type: "number",
    label: "Wooden Barrel Aspect Ratio",
    group: "ASSETS"
  },
  charDinoBlockAspectRatio: {
    value: 1.0728,
    // 545x508
    type: "number",
    label: "Dino Block Aspect Ratio",
    group: "ASSETS"
  },
  playerSprite: {
    value: void 0,
    type: "sprite",
    label: "Player Sprite",
    group: "Visuals"
  }
};
var { playgroundConfig } = globalThis;
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key], { value });
    }
  }
}
function getConfig(key) {
  return CONFIG[key].value;
}
var HIDING_OBJECTS = [
  {
    id: "obj_brick_house",
    nameEs: "Casa de Ladrillo",
    nameEn: "Brick House",
    aspectRatioKey: "objBrickHouseAspectRatio",
    colors: {
      primary: { nameEs: "Naranja Ladrillo", nameEn: "Brick Orange", hex: "#d85d38" },
      secondary: { nameEs: "Gris Cemento", nameEn: "Cement Gray", hex: "#5e6b7c" }
    }
  },
  {
    id: "obj_toy_rocket",
    nameEs: "Cohete de Juguete",
    nameEn: "Toy Rocket",
    aspectRatioKey: "objToyRocketAspectRatio",
    colors: {
      primary: { nameEs: "Blanco Lunar", nameEn: "Lunar White", hex: "#f0f4f8" },
      secondary: { nameEs: "Azul Cielo", nameEn: "Sky Blue", hex: "#45b7e8" }
    }
  },
  {
    id: "obj_hay_bale",
    nameEs: "Fardo de Heno",
    nameEn: "Hay Bale",
    aspectRatioKey: "objHayBaleAspectRatio",
    colors: {
      primary: { nameEs: "Amarillo Trigo", nameEn: "Wheat Yellow", hex: "#f5ca38" },
      secondary: { nameEs: "Marr\xF3n Tostado", nameEn: "Toasted Brown", hex: "#9a5f27" }
    }
  },
  {
    id: "obj_camping_tent",
    nameEs: "Tienda de Campa\xF1a",
    nameEn: "Camping Tent",
    aspectRatioKey: "objCampingTentAspectRatio",
    colors: {
      primary: { nameEs: "Verde Esmeralda", nameEn: "Emerald Green", hex: "#0f8b5f" },
      secondary: { nameEs: "Amarillo Mostaza", nameEn: "Mustard Yellow", hex: "#deb135" }
    }
  },
  {
    id: "obj_giant_mushroom",
    nameEs: "Hongo Gigante",
    nameEn: "Giant Mushroom",
    aspectRatioKey: "objGiantMushroomAspectRatio",
    colors: {
      primary: { nameEs: "Rojo Carmes\xED", nameEn: "Crimson Red", hex: "#e33434" },
      secondary: { nameEs: "Blanco Nieve", nameEn: "Snow White", hex: "#ffffff" }
    }
  },
  {
    id: "obj_toy_chest",
    nameEs: "Cofre de Juguetes",
    nameEn: "Toy Chest",
    aspectRatioKey: "objToyChestAspectRatio",
    colors: {
      primary: { nameEs: "Azul Real", nameEn: "Royal Blue", hex: "#2952b2" },
      secondary: { nameEs: "Oro Brillante", nameEn: "Bright Gold", hex: "#f4be22" }
    }
  },
  {
    id: "obj_enchanted_tree",
    nameEs: "\xC1rbol Frondoso",
    nameEn: "Lush Tree",
    aspectRatioKey: "objEnchantedTreeAspectRatio",
    colors: {
      primary: { nameEs: "Verde Pino", nameEn: "Pine Green", hex: "#2d8a4e" },
      secondary: { nameEs: "Caf\xE9 Roble", nameEn: "Oak Brown", hex: "#7c4b27" }
    }
  },
  {
    id: "obj_wooden_barrel",
    nameEs: "Barril R\xFAstico",
    nameEn: "Wooden Barrel",
    aspectRatioKey: "objWoodenBarrelAspectRatio",
    colors: {
      primary: { nameEs: "Madera Caoba", nameEn: "Mahogany Wood", hex: "#864123" },
      secondary: { nameEs: "Hierro Met\xE1lico", nameEn: "Metallic Iron", hex: "#4c5462" }
    }
  }
];
var CHARACTERS = [
  {
    id: "cubito",
    nameEs: "Cubito el Explorador",
    nameEn: "Cubito Explorer",
    type: "spritesheet",
    idleKey: "char_cubito_explorer_idle",
    runKey: "char_cubito_explorer_run",
    jumpKey: "char_cubito_explorer_jump"
  },
  {
    id: "robo",
    nameEs: "Robo-Bloque",
    nameEn: "Robo Block",
    type: "spritesheet",
    idleKey: "char_robo_block_idle",
    runKey: "char_robo_block_run",
    jumpKey: "char_robo_block_jump"
  },
  {
    id: "cat",
    nameEs: "Gatito Pixel",
    nameEn: "Pixel Kitty",
    type: "spritesheet",
    idleKey: "char_pixel_cat_quad_idle",
    runKey: "char_pixel_cat_quad_running",
    jumpKey: "char_pixel_cat_quad_jump"
  },
  {
    id: "dino",
    nameEs: "Dino-Cubo",
    nameEn: "Dino Block",
    type: "static",
    idleKey: "char_dino_block",
    aspectRatioKey: "charDinoBlockAspectRatio"
  }
];

// ESCONDIDA2/utils/BackgroundMusic.tsx
import { useEffect, useRef, useState } from "react";
import { jsx } from "react/jsx-runtime";
var DEFAULT_VOLUME = 0.15;
var SILENCE_THRESHOLD_AMPLITUDE = 3e-3;
var SAFETY_MARGIN_SEC = 2e-3;
var DECLICK_RAMP_SEC = 0.025;
var VOLUME_TIME_CONSTANT_SEC = 0.015;
var DEFAULT_CROSSFADE_SEC = 0.6;
var MAX_END_SCAN_SEC = 8;
var MIN_SAMPLES = 128;
function scanAudioBoundaries(buffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const totalSamples = buffer.length;
  if (totalSamples === 0) {
    return { startSample: 0, endSample: 0 };
  }
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  let startIndex = 0;
  const maxStartScan = Math.min(totalSamples, sampleRate);
  for (let i = 0; i < maxStartScan; i++) {
    let peak = 0;
    for (let c = 0; c < numChannels; c++) {
      const sampleAmplitude = Math.abs(channels[c][i]);
      if (sampleAmplitude > peak) peak = sampleAmplitude;
    }
    if (peak > SILENCE_THRESHOLD_AMPLITUDE) {
      const marginSamples = Math.floor(sampleRate * SAFETY_MARGIN_SEC);
      let targetIndex = Math.max(0, i - marginSamples);
      while (targetIndex > 0 && targetIndex > i - marginSamples - 256) {
        if (channels[0][targetIndex] >= 0 && channels[0][targetIndex - 1] < 0) {
          break;
        }
        targetIndex--;
      }
      startIndex = targetIndex;
      break;
    }
  }
  let endIndex = totalSamples;
  const maxEndScanSamples = Math.min(
    Math.floor(totalSamples * 0.5),
    Math.floor(sampleRate * MAX_END_SCAN_SEC)
  );
  const minEndScan = Math.max(0, totalSamples - maxEndScanSamples);
  for (let i = totalSamples - 1; i >= minEndScan; i--) {
    let peak = 0;
    for (let c = 0; c < numChannels; c++) {
      const sampleAmplitude = Math.abs(channels[c][i]);
      if (sampleAmplitude > peak) peak = sampleAmplitude;
    }
    if (peak > SILENCE_THRESHOLD_AMPLITUDE) {
      const marginSamples = Math.floor(sampleRate * SAFETY_MARGIN_SEC);
      let targetIndex = Math.min(totalSamples, i + 1 + marginSamples);
      while (targetIndex < totalSamples && targetIndex < i + marginSamples + 256) {
        if (channels[0][targetIndex] >= 0 && channels[0][targetIndex - 1] < 0) {
          break;
        }
        targetIndex++;
      }
      endIndex = targetIndex;
      break;
    }
  }
  return {
    startSample: startIndex,
    endSample: Math.max(startIndex + MIN_SAMPLES, endIndex)
  };
}
function createSeamlessLoopBuffer(ctx, rawBuffer, boundaries, crossfadeDurationSec = DEFAULT_CROSSFADE_SEC) {
  const sampleRate = rawBuffer.sampleRate;
  const numChannels = rawBuffer.numberOfChannels;
  const startSample = Math.max(0, boundaries.startSample);
  const endSample = Math.min(rawBuffer.length, boundaries.endSample);
  const trimmedLength = endSample - startSample;
  if (trimmedLength <= 0) {
    return {
      buffer: rawBuffer,
      loopStartSec: 0,
      loopEndSec: rawBuffer.duration
    };
  }
  const maxCrossfade = Math.floor(trimmedLength * 0.25);
  const targetCrossfade = Math.floor(crossfadeDurationSec * sampleRate);
  const crossfadeSamples = Math.min(targetCrossfade, maxCrossfade);
  if (crossfadeSamples < MIN_SAMPLES) {
    const sliced = ctx.createBuffer(numChannels, trimmedLength, sampleRate);
    for (let c = 0; c < numChannels; c++) {
      const src = rawBuffer.getChannelData(c);
      sliced.getChannelData(c).set(src.subarray(startSample, endSample));
    }
    return {
      buffer: sliced,
      loopStartSec: 0,
      loopEndSec: sliced.duration
    };
  }
  const loopedBuffer = ctx.createBuffer(numChannels, trimmedLength, sampleRate);
  const halfPi = Math.PI / 2;
  const fadeInWeights = new Float32Array(crossfadeSamples);
  const fadeOutWeights = new Float32Array(crossfadeSamples);
  for (let i = 0; i < crossfadeSamples; i++) {
    const progress = i / crossfadeSamples;
    fadeInWeights[i] = Math.sin(progress * halfPi);
    fadeOutWeights[i] = Math.cos(progress * halfPi);
  }
  const bodyLength = trimmedLength - crossfadeSamples;
  const tailStart = endSample - crossfadeSamples;
  for (let c = 0; c < numChannels; c++) {
    const src = rawBuffer.getChannelData(c);
    const dst = loopedBuffer.getChannelData(c);
    dst.set(src.subarray(startSample, startSample + bodyLength), 0);
    for (let i = 0; i < crossfadeSamples; i++) {
      const headSample = src[startSample + i];
      const tailSample = src[tailStart + i];
      const mixed = headSample * fadeInWeights[i] + tailSample * fadeOutWeights[i];
      dst[bodyLength + i] = Math.max(-1, Math.min(1, mixed));
    }
  }
  return {
    buffer: loopedBuffer,
    loopStartSec: crossfadeSamples / sampleRate,
    loopEndSec: loopedBuffer.duration
  };
}
function BackgroundMusic({
  url,
  isPlaying,
  isMuted = false,
  volume = DEFAULT_VOLUME
}) {
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const trackGainRef = useRef(null);
  const loopResultRef = useRef(null);
  const unlockCleanupRef = useRef(null);
  const fallbackAudioRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const [useFallback, setUseFallback] = useState(false);
  const useFallbackRef = useRef(false);
  const [platformMuted, setPlatformMuted] = useState(false);
  const effectiveMuted = isMuted || platformMuted;
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    const handlePlatformMute = (e) => {
      const customEvent = e;
      if (typeof customEvent.detail?.muted === "boolean") {
        setPlatformMuted(customEvent.detail.muted);
      }
    };
    window.addEventListener("playground-mute", handlePlatformMute);
    return () => {
      window.removeEventListener("playground-mute", handlePlatformMute);
    };
  }, []);
  const getOrCreateContext = () => {
    if (typeof window === "undefined") return null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      return audioCtxRef.current;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setUseFallback(true);
      useFallbackRef.current = true;
      return null;
    }
    try {
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      const targetGain = effectiveMuted ? 0 : Math.max(0, Math.min(1, volume));
      masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);
      masterGain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      const unlock = () => {
        if (ctx.state === "suspended") {
          void ctx.resume().then(() => {
            try {
              const buf = ctx.createBuffer(1, 1, 22050);
              const src = ctx.createBufferSource();
              src.buffer = buf;
              src.connect(ctx.destination);
              src.start(0);
            } catch (_) {
            }
          }).catch(() => {
          });
        }
        if (ctx.state === "running") {
          cleanupUnlock();
        }
      };
      const cleanupUnlock = () => {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("click", unlock);
      };
      unlockCleanupRef.current = cleanupUnlock;
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("click", unlock, { passive: true });
      return ctx;
    } catch {
      setUseFallback(true);
      useFallbackRef.current = true;
      return null;
    }
  };
  const stopWebAudioSource = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (_) {
      }
      sourceNodeRef.current = null;
    }
    if (trackGainRef.current) {
      try {
        trackGainRef.current.disconnect();
      } catch (_) {
      }
      trackGainRef.current = null;
    }
  };
  const startWebAudioLoop = () => {
    if (useFallbackRef.current) return;
    const ctx = getOrCreateContext();
    const loopResult = loopResultRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !loopResult || !masterGain) return;
    stopWebAudioSource();
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {
      });
    }
    const source = ctx.createBufferSource();
    source.buffer = loopResult.buffer;
    source.loop = true;
    source.loopStart = loopResult.loopStartSec;
    source.loopEnd = loopResult.loopEndSec;
    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0, ctx.currentTime);
    trackGain.gain.linearRampToValueAtTime(
      1,
      ctx.currentTime + DECLICK_RAMP_SEC
    );
    source.connect(trackGain);
    trackGain.connect(masterGain);
    source.onended = () => {
      try {
        source.disconnect();
        trackGain.disconnect();
      } catch (_) {
      }
    };
    source.start(0);
    sourceNodeRef.current = source;
    trackGainRef.current = trackGain;
  };
  useEffect(() => {
    setUseFallback(false);
    useFallbackRef.current = false;
    stopWebAudioSource();
    loopResultRef.current = null;
    if (!url) {
      return;
    }
    let isCancelled = false;
    const abortController = new AbortController();
    fetch(url, {
      mode: "cors",
      credentials: "omit",
      signal: abortController.signal
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.arrayBuffer();
    }).then((arrayBuffer) => {
      const ctx = getOrCreateContext();
      if (!ctx) throw new Error("AudioContext unavailable");
      return ctx.decodeAudioData(arrayBuffer);
    }).then((decodedBuffer) => {
      if (isCancelled || abortController.signal.aborted) return;
      const ctx = getOrCreateContext();
      if (!ctx) return;
      const boundaries = scanAudioBoundaries(decodedBuffer);
      loopResultRef.current = createSeamlessLoopBuffer(
        ctx,
        decodedBuffer,
        boundaries,
        DEFAULT_CROSSFADE_SEC
      );
      if (isPlayingRef.current) {
        startWebAudioLoop();
      }
    }).catch((err) => {
      if (isCancelled || abortController.signal.aborted) return;
      console.warn(
        "[BackgroundMusic] Web Audio load failed, falling back to HTML5 audio:",
        err
      );
      setUseFallback(true);
      useFallbackRef.current = true;
    });
    return () => {
      isCancelled = true;
      abortController.abort();
      stopWebAudioSource();
      loopResultRef.current = null;
    };
  }, [url]);
  useEffect(() => {
    if (useFallback) {
      const audio = fallbackAudioRef.current;
      if (!audio) return;
      if (isPlaying) {
        void audio.play().catch(() => {
        });
      } else {
        audio.pause();
      }
      return;
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (isPlaying) {
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {
        });
      }
      if (!sourceNodeRef.current && loopResultRef.current) {
        startWebAudioLoop();
      }
    } else {
      if (ctx.state === "running") {
        void ctx.suspend().catch(() => {
        });
      }
    }
  }, [isPlaying, useFallback]);
  useEffect(() => {
    const handleVisibility = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || useFallback) return;
      if (document.hidden) {
        if (ctx.state === "running") {
          void ctx.suspend().catch(() => {
          });
        }
      } else if (isPlayingRef.current) {
        if (ctx.state === "suspended") {
          void ctx.resume().catch(() => {
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [useFallback]);
  useEffect(() => {
    const targetGain = effectiveMuted ? 0 : Math.max(0, Math.min(1, volume));
    if (useFallback) {
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.muted = effectiveMuted;
        fallbackAudioRef.current.volume = targetGain;
      }
      return;
    }
    const ctx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (ctx && masterGain && ctx.state !== "closed") {
      masterGain.gain.setTargetAtTime(
        targetGain,
        ctx.currentTime,
        VOLUME_TIME_CONSTANT_SEC
      );
    }
  }, [effectiveMuted, volume, useFallback]);
  useEffect(() => {
    return () => {
      stopWebAudioSource();
      if (unlockCleanupRef.current) {
        unlockCleanupRef.current();
        unlockCleanupRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close().catch(() => {
        });
        audioCtxRef.current = null;
        masterGainRef.current = null;
      }
      loopResultRef.current = null;
    };
  }, []);
  if (useFallback && url) {
    return /* @__PURE__ */ jsx(
      "audio",
      {
        ref: fallbackAudioRef,
        src: url,
        loop: true,
        autoPlay: isPlaying,
        style: { display: "none" }
      }
    );
  }
  return null;
}
var BackgroundMusic_default = BackgroundMusic;

// ESCONDIDA2/utils/helper.tsx
import {
  useEffect as useEffect2,
  useRef as useRef2,
  useState as useState2
} from "react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var TONE_CLASS = {
  neutral: "bg-black/70",
  danger: "bg-red-900/80",
  victory: "bg-emerald-900/80"
};
function useAutoFocus(enabled = true) {
  const ref = useRef2(null);
  useEffect2(() => {
    if (enabled && ref.current) {
      ref.current.focus();
    }
  }, [enabled]);
  return ref;
}
function MenuOverlay({
  children,
  tone = "neutral",
  zIndex = 40
}) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className: `absolute inset-0 ${TONE_CLASS[tone]} overflow-y-auto touch-auto`,
      style: { zIndex },
      children: /* @__PURE__ */ jsx2("div", { className: "min-h-full flex flex-col items-center p-4", children: /* @__PURE__ */ jsx2("div", { className: "m-auto w-full max-w-md flex flex-col items-center", children }) })
    }
  );
}
var ACTION_KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
  Enter: "confirm",
  " ": "confirm",
  Escape: "cancel"
};
var createEmptyActions = () => ({
  left: false,
  right: false,
  up: false,
  down: false,
  confirm: false,
  cancel: false,
  tap: false
});
var getPointerPosition = (event, canvas, logicalSize) => {
  const rect = canvas.getBoundingClientRect();
  const width = logicalSize?.width ?? rect.width;
  const height = logicalSize?.height ?? rect.height;
  const x = (event.clientX - rect.left) * (width / rect.width);
  const y = (event.clientY - rect.top) * (height / rect.height);
  return { x, y };
};
var useInput = (canvasRef, enabled = true, logicalSize) => {
  const inputRef = useRef2({
    actions: createEmptyActions(),
    pointer: { x: 0, y: 0, down: false }
  });
  useEffect2(() => {
    if (!enabled) {
      inputRef.current.actions = createEmptyActions();
      inputRef.current.pointer = { x: 0, y: 0, down: false };
      return;
    }
    const handleKeyDown = (event) => {
      const action = ACTION_KEYS[event.key];
      if (!action) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
        event.key
      )) {
        event.preventDefault();
      }
      inputRef.current.actions[action] = true;
    };
    const handleKeyUp = (event) => {
      const action = ACTION_KEYS[event.key];
      if (!action) return;
      inputRef.current.actions[action] = false;
    };
    const handlePointerDown = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (event.target === canvas || canvas.contains(event.target)) {
        if (typeof canvas.setPointerCapture === "function") {
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch (e) {
          }
        }
        inputRef.current.pointer = {
          ...getPointerPosition(event, canvas, logicalSize),
          down: true
        };
        inputRef.current.actions.tap = true;
      }
    };
    const handlePointerMove = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (inputRef.current.pointer.down || event.target === canvas) {
        inputRef.current.pointer = {
          ...getPointerPosition(event, canvas, logicalSize),
          down: inputRef.current.pointer.down
        };
      }
    };
    const handlePointerUp = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (typeof canvas.releasePointerCapture === "function" && canvas.hasPointerCapture(event.pointerId)) {
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch (e) {
        }
      }
      inputRef.current.pointer = {
        ...getPointerPosition(event, canvas, logicalSize),
        down: false
      };
      inputRef.current.actions.tap = false;
    };
    const handleBlur = () => {
      inputRef.current.actions = createEmptyActions();
      if (inputRef.current.pointer) {
        inputRef.current.pointer.down = false;
      }
      inputRef.current.actions.tap = false;
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBlur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [canvasRef, enabled, logicalSize?.width, logicalSize?.height]);
  return inputRef;
};
var GameAudio = class {
  ctx = null;
  master = null;
  sfxMaster = null;
  muted = false;
  // SFX muted
  volume = 0.6;
  // master volume, 0..1
  constructor() {
    if (typeof window !== "undefined") {
      this.attachUnlock();
      window.addEventListener("playground-mute", (e) => {
        const customEvent = e;
        this.setMuted(customEvent.detail.muted);
      });
    }
  }
  // --- Context lifecycle -----------------------------------------------------
  /**
   * Lazily create the AudioContext + master gain on first use. Returns null when
   * Web Audio is unavailable (e.g. during SSR), in which case all play calls
   * become no-ops.
   */
  ensure() {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      console.warn("[audio] Web Audio API not supported");
      return null;
    }
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.sfxMaster = this.ctx.createGain();
    this.master.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.sfxMaster.gain.setValueAtTime(
      this.muted ? 0 : 1,
      this.ctx.currentTime
    );
    this.sfxMaster.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.attachUnlock();
    return this.ctx;
  }
  /** Resume the context on the first user gesture (one-shot). */
  attachUnlock() {
    if (typeof window === "undefined") return;
    const unlock = () => {
      this.ensure();
      void this.ctx?.resume().catch(() => {
      });
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
  }
  /** Manually resume the context — call from a click handler if needed. */
  resume() {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {
    });
  }
  /** Prepare to play a one-shot. Returns null when muted or unavailable. */
  begin() {
    const ctx = this.ensure();
    const out = this.sfxMaster;
    if (!ctx || !out || this.muted) return null;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {
    });
    return { ctx, out, now: ctx.currentTime };
  }
  // --- Master controls -------------------------------------------------------
  /** Set master volume (0..1). Affects SFX. */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && !this.muted) {
      this.master.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
  /** Toggle global SFX mute. Returns the new muted state. */
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
  setMuted(muted) {
    this.muted = muted;
    if (this.sfxMaster && this.ctx) {
      this.sfxMaster.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }
  getMuteState() {
    return this.muted;
  }
  // --- Synthesis helpers -----------------------------------------------------
  /** Schedule one enveloped oscillator. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  blip(b, at, o) {
    const { ctx, out } = b;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? "square";
    osc.frequency.setValueAtTime(o.freq, at);
    if (o.freqTo !== void 0) {
      if ((o.glide ?? "exp") === "lin") {
        osc.frequency.linearRampToValueAtTime(o.freqTo, at + o.dur);
      } else {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, o.freqTo),
          at + o.dur
        );
      }
    }
    const peak = o.gain ?? 0.15;
    g.gain.setValueAtTime(peak, at);
    g.gain.exponentialRampToValueAtTime(1e-4, at + o.dur);
    osc.connect(g);
    g.connect(out);
    osc.start(at);
    osc.stop(at + o.dur + 0.02);
  }
  /** Schedule a filtered white-noise burst (impacts, explosions). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  noiseBurst(b, at, o) {
    const { ctx, out } = b;
    const len = Math.max(1, Math.floor(ctx.sampleRate * o.dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(o.from ?? 1e3, at);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(1, o.to ?? 80),
      at + o.dur
    );
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.gain ?? 0.18, at);
    g.gain.exponentialRampToValueAtTime(1e-4, at + o.dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start(at);
    src.stop(at + o.dur);
  }
  /** Small random multiplier so rapid-fire sounds don't feel robotic. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vary(amount = 0.05) {
    return 1 + (Math.random() * 2 - 1) * amount;
  }
  // --- Sound effects ---------------------------------------------------------
  /** Generic one-shot tone — escape hatch for custom blips. */
  playTone(o) {
    const b = this.begin();
    if (!b) return;
    this.blip(b, b.now, {
      type: o.type,
      freq: o.freq,
      freqTo: o.freqTo,
      dur: o.dur ?? 0.15,
      gain: o.gain
    });
  }
  // INSERT_SFX_HERE
  playShieldBlock() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "sine", freq: 100 * v, freqTo: 30 * v, dur: 0.2, gain: 0.2 });
    this.noiseBurst(b, b.now, { dur: 0.15, gain: 0.12, from: 500, to: 100 });
  }
  playErrorBuzz() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "sawtooth", freq: 150 * v, dur: 0.2, gain: 0.08 });
    this.blip(b, b.now + 0.05, { type: "sawtooth", freq: 159 * v, dur: 0.2, gain: 0.08 });
  }
  playCrispClick() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "sine", freq: 1200 * v, dur: 0.015, gain: 0.1 });
  }
  playHoverMicroTone() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary(0.02);
    this.blip(b, b.now, { type: "sine", freq: 880 * v, dur: 0.03, gain: 0.05 });
  }
  playConfirmSelect() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "sine", freq: 523.25 * v, dur: 0.1, gain: 0.08 });
    this.blip(b, b.now + 0.08, { type: "sine", freq: 783.99 * v, dur: 0.15, gain: 0.1 });
  }
  playCoinPickup() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "square", freq: 987.77 * v, dur: 0.1, gain: 0.08 });
    this.blip(b, b.now + 0.08, { type: "square", freq: 1318.51 * v, dur: 0.2, gain: 0.08 });
  }
  playPowerupChime() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      this.blip(b, b.now + i * 0.06, { type: "sine", freq: freq * v, dur: 0.15, gain: 0.06 });
    });
  }
  playVictoryFanfare() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    const notes = [261.63, 329.63, 392, 523.25];
    notes.forEach((freq, i) => {
      this.blip(b, b.now + i * 0.1, { type: "sawtooth", freq: freq * v, dur: 0.4, gain: 0.06 });
      this.blip(b, b.now + i * 0.1, { type: "sine", freq: freq * v, dur: 0.4, gain: 0.04 });
    });
    const chordTime = notes.length * 0.1;
    notes.forEach((freq) => {
      this.blip(b, b.now + chordTime, { type: "triangle", freq: freq * v, dur: 0.8, gain: 0.06 });
    });
  }
  playDefeatMotif() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    const notes = [311.13, 261.63, 246.94, 196];
    notes.forEach((freq, i) => {
      this.blip(b, b.now + i * 0.15, { type: "sawtooth", freq: freq * v, dur: 0.3, gain: 0.08 });
      this.blip(b, b.now + i * 0.15, { type: "sine", freq: freq * 0.5 * v, dur: 0.35, gain: 0.06 });
    });
  }
  playLevelUpStinger() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.blip(b, b.now + i * 0.07, { type: "sine", freq: freq * v, dur: 0.25, gain: 0.06 });
    });
    const tailTime = notes.length * 0.07;
    this.noiseBurst(b, b.now + tailTime, { dur: 0.8, gain: 0.05, from: 3e3, to: 6e3 });
    for (let i = 0; i < 5; i++) {
      this.blip(b, b.now + tailTime + i * 0.1, {
        type: "sine",
        freq: (2e3 + i * 500) * this.vary(0.1),
        dur: 0.2,
        gain: 0.03
      });
    }
  }
  playRetroJump() {
    const b = this.begin();
    if (!b) return;
    const v = this.vary();
    this.blip(b, b.now, { type: "square", freq: 150 * v, freqTo: 600 * v, dur: 0.15, gain: 0.1 });
  }
};
var gameAudio = new GameAudio();
var prepareCanvas = (ctx, width, height) => {
  const scale = window.devicePixelRatio || 1;
  const displayWidth = Math.floor(width * scale);
  const displayHeight = Math.floor(height * scale);
  if (ctx.canvas.width !== displayWidth || ctx.canvas.height !== displayHeight) {
    ctx.canvas.width = displayWidth;
    ctx.canvas.height = displayHeight;
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
};
var createFixedStepper = (stepMs, maxSubSteps = 5) => {
  let lastTime = 0;
  let accumulator = 0;
  return (time, onStep) => {
    if (lastTime === 0) {
      lastTime = time;
      return;
    }
    const frameMs = Math.min(time - lastTime, stepMs * maxSubSteps);
    lastTime = time;
    accumulator += frameMs;
    let steps = 0;
    while (accumulator >= stepMs && steps < maxSubSteps) {
      onStep(stepMs / 1e3);
      accumulator -= stepMs;
      steps += 1;
    }
  };
};
function useAssets(manifest) {
  const [assets, setAssets] = useState2(
    {}
  );
  const [isReady, setIsReady] = useState2(false);
  const manifestStr = JSON.stringify(manifest);
  useEffect2(() => {
    const currentManifest = JSON.parse(manifestStr);
    const urls = Object.entries(currentManifest);
    if (urls.length === 0) {
      setIsReady(true);
      return;
    }
    let loadedCount = 0;
    const loadedAssets = {};
    urls.forEach(([id, url]) => {
      const img = new Image();
      let retriedWithoutCors = false;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loadedAssets[id] = img;
        loadedCount++;
        if (loadedCount === urls.length) {
          setAssets(loadedAssets);
          setIsReady(true);
        }
      };
      img.onerror = () => {
        if (!retriedWithoutCors) {
          retriedWithoutCors = true;
          img.removeAttribute("crossorigin");
          img.src = url;
          return;
        }
        console.warn(`[AssetPreloader] Failed to load asset: ${id} at ${url}`);
        loadedAssets[id] = null;
        loadedCount++;
        if (loadedCount === urls.length) {
          setAssets(loadedAssets);
          setIsReady(true);
        }
      };
      img.src = url;
    });
  }, [manifestStr]);
  return { assets, isReady };
}
function drawAsset(ctx, img, x, y, w, h, fallbackDraw) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    fallbackDraw(ctx);
  }
}
function drawBackground(ctx, bgImg, canvasWidth, canvasHeight, fallbackColor = "#222222", camX = 0, camY = 0) {
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    const parallaxFactor = 0.5;
    const bgX = camX * parallaxFactor % canvasWidth;
    const bgY = camY * parallaxFactor % canvasHeight;
    ctx.drawImage(bgImg, -bgX, -bgY, canvasWidth, canvasHeight);
    ctx.drawImage(bgImg, -bgX + canvasWidth, -bgY, canvasWidth, canvasHeight);
    ctx.drawImage(bgImg, -bgX, -bgY + canvasHeight, canvasWidth, canvasHeight);
    ctx.drawImage(
      bgImg,
      -bgX + canvasWidth,
      -bgY + canvasHeight,
      canvasWidth,
      canvasHeight
    );
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}
function useIsMobile() {
  const [isMobile, setIsMobile] = useState2(() => {
    if (typeof window === "undefined") return false;
    const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const touch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const small = window.innerWidth < 768;
    return ua || touch || small;
  });
  useEffect2(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// ESCONDIDA2/utils/usePlayground.ts
import { useCallback, useEffect as useEffect3, useRef as useRef3, useState as useState3 } from "react";
function usePlayground() {
  const [isReady, setIsReady] = useState3(false);
  const sdkRef = useRef3(null);
  const onGameEventRef = useRef3(null);
  const onPresenceEventRef = useRef3(null);
  const onLobbyStatusRef = useRef3(null);
  useEffect3(() => {
    if (sdkRef.current) return;
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.PlaygroundSDK) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://www.gstatic.com/play/games/playground/sdk/dev/v1/playground.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Playground SDK script"));
        document.head.appendChild(script);
      });
    };
    const initSDK = async () => {
      try {
        const isSandboxPreview = window.location.hostname === "test.com" || window.__PLAYGROUND_PREVIEW__ === true;
        if (isSandboxPreview) {
          console.log(
            "\u{1F50C} [usePlayground] Local or Preview environment. Loading Fake SDK..."
          );
          const module = await Promise.resolve().then(() => (init_playground_fake(), playground_fake_exports));
          window.PlaygroundSDK = module.FakePlaygroundSDK;
        } else {
          await loadScript();
        }
        if (window.PlaygroundSDK) {
          sdkRef.current = new window.PlaygroundSDK();
          await sdkRef.current.init(
            (event) => onGameEventRef.current?.(event),
            (presence) => onPresenceEventRef.current?.(presence),
            (status) => onLobbyStatusRef.current?.(status)
          );
          setIsReady(true);
        } else {
          console.error("Playground SDK class not found after script load.");
        }
      } catch (error) {
        console.error("Playground SDK initialization failed:", error);
      }
    };
    initSDK();
  }, []);
  return {
    sdk: sdkRef.current,
    isReady,
    onGameEventRef,
    onPresenceEventRef,
    onLobbyStatusRef
  };
}
function usePlaygroundGameLifecycle(gameState, sdk) {
  const defaultHook = usePlayground();
  const activeSdk = sdk ?? defaultHook.sdk;
  const hasCalledGameOver = useRef3(false);
  const hasCalledLevelComplete = useRef3(false);
  const lastScoreRef = useRef3(gameState.score);
  const lastLevelRef = useRef3(gameState.level);
  const lastIsPausedRef = useRef3(false);
  lastScoreRef.current = gameState.score;
  lastLevelRef.current = gameState.level;
  useEffect3(() => {
    if (!activeSdk) return;
    const status = (gameState.status || "").toUpperCase();
    const isGameOver = status === "GAME_OVER" || status === "DEFEAT" || status === "LOST";
    const isLevelComplete = status === "VICTORY" || status === "WIN" || status === "LEVEL_COMPLETE";
    const currentLevel = gameState.level ?? 1;
    const isPaused = status === "PAUSED" || status === "PAUSE";
    if (lastIsPausedRef.current !== isPaused) {
      if (typeof activeSdk.pauseStateChanged === "function") {
        activeSdk.pauseStateChanged(isPaused);
      }
      lastIsPausedRef.current = isPaused;
    }
    if (status === "PLAYING") {
      activeSdk.scoreUpdated({
        value: gameState.score,
        level: String(currentLevel)
      });
      hasCalledGameOver.current = false;
      hasCalledLevelComplete.current = false;
    } else if (isGameOver) {
      if (!hasCalledGameOver.current) {
        activeSdk.scoreUpdated({
          value: gameState.score,
          level: String(currentLevel)
        });
        activeSdk.gameOver();
        hasCalledGameOver.current = true;
      }
    } else if (isLevelComplete) {
      if (!hasCalledLevelComplete.current) {
        activeSdk.scoreUpdated({
          value: gameState.score,
          level: String(currentLevel)
        });
        activeSdk.levelComplete(currentLevel);
        hasCalledLevelComplete.current = true;
      }
    }
  }, [gameState.score, gameState.status, gameState.level, activeSdk]);
  useEffect3(() => {
    return () => {
      if (activeSdk && !hasCalledGameOver.current && !hasCalledLevelComplete.current && lastScoreRef.current > 0) {
        try {
          const levelToReport = lastLevelRef.current ?? 1;
          activeSdk.scoreUpdated({
            value: lastScoreRef.current,
            level: String(levelToReport)
          });
          activeSdk.gameOver();
        } catch (_) {
        }
      }
    };
  }, [activeSdk]);
}
var nextMessageId = 0;
function generateMessageId() {
  return `rpc-message-${nextMessageId++}`;
}
function useRpc(rpcName) {
  const [isLoading, setIsLoading] = useState3(false);
  const resolvers = useRef3(/* @__PURE__ */ new Map()).current;
  const rejecters = useRef3(
    /* @__PURE__ */ new Map()
  ).current;
  useEffect3(() => {
    const handleResponse = (event) => {
      const response = event.data;
      if (response && response.messageId && (resolvers.has(response.messageId) || rejecters.has(response.messageId))) {
        if (response.success) {
          resolvers.get(response.messageId)?.(response.payload);
        } else {
          rejecters.get(response.messageId)?.(
            new Error(response.error ?? "Unknown RPC error")
          );
        }
        resolvers.delete(response.messageId);
        rejecters.delete(response.messageId);
      }
    };
    window.addEventListener("message", handleResponse);
    return () => {
      window.removeEventListener("message", handleResponse);
    };
  }, [resolvers, rejecters]);
  const callRpc = useCallback(
    (payload) => {
      setIsLoading(true);
      const promise = new Promise((resolve, reject) => {
        const messageId = generateMessageId();
        resolvers.set(messageId, resolve);
        rejecters.set(messageId, reject);
        const message = {
          type: rpcName,
          payload,
          messageId
        };
        window.parent.postMessage(message, "*");
      });
      promise.finally(() => {
        setIsLoading(false);
      });
      return promise;
    },
    [rpcName, resolvers, rejecters]
  );
  return [callRpc, isLoading];
}

// ESCONDIDA2/SpriteRenderer.ts
var SpriteRenderer = class {
  configs;
  constructor(configs) {
    this.configs = configs;
  }
  /**
   * Advances the animation state based on delta time.
   */
  getNextState(currentState, deltaTime) {
    const config = this.configs[currentState.currentAction];
    if (!config) return currentState;
    const nextState = { ...currentState };
    nextState.timer += deltaTime;
    const frameDuration = 1 / config.fps;
    if (nextState.timer >= frameDuration) {
      const framesToAdvance = Math.floor(nextState.timer / frameDuration);
      nextState.timer %= frameDuration;
      nextState.currentFrame = (nextState.currentFrame + framesToAdvance) % config.totalFrames;
      if (config.loop === false && nextState.currentFrame < currentState.currentFrame) {
        nextState.currentFrame = config.totalFrames - 1;
      }
    }
    return nextState;
  }
  /**
   * Draws the sprite to the canvas using preloaded images.
   */
  draw(ctx, state, x, y, width, height, loadedImages, flipX = false, alpha = 1) {
    const config = this.configs[state.currentAction];
    if (!config) return;
    const img = loadedImages[config.imageUrl];
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.save();
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(x, y, width, height);
      ctx.restore();
      return;
    }
    const framesPerRow = Math.max(
      1,
      Math.floor(img.naturalWidth / config.frameWidth)
    );
    const frameIndex = state.currentFrame % config.totalFrames;
    const sourceX = frameIndex % framesPerRow * config.frameWidth;
    const sourceY = Math.floor(frameIndex / framesPerRow) * config.frameHeight;
    ctx.save();
    if (alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    if (flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        config.frameWidth,
        config.frameHeight,
        0,
        0,
        width,
        height
      );
    } else {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        config.frameWidth,
        config.frameHeight,
        x,
        y,
        width,
        height
      );
    }
    ctx.restore();
  }
};

// ESCONDIDA2/App.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var BACKGROUND_MUSIC_URL = "./assets/audio/bgm_playful_hideout.mp3";
var ASSETS_MANIFEST = {
  bg_playfield: "./assets/images/bg_playfield.png",
  obj_brick_house: "./assets/images/obj_brick_house.png",
  obj_toy_rocket: "./assets/images/obj_toy_rocket.png",
  obj_hay_bale: "./assets/images/obj_hay_bale.png",
  obj_camping_tent: "./assets/images/obj_camping_tent.png",
  obj_giant_mushroom: "./assets/images/obj_giant_mushroom.png",
  obj_toy_chest: "./assets/images/obj_toy_chest.png",
  obj_enchanted_tree: "./assets/images/obj_enchanted_tree.png",
  obj_wooden_barrel: "./assets/images/obj_wooden_barrel.png",
  char_dino_block: "./assets/images/char_dino_block.png",
  char_cubito_explorer_idle: "./assets/images/char_cubito_explorer_idle.png",
  char_cubito_explorer_run: "./assets/images/char_cubito_explorer_run.png",
  char_cubito_explorer_jump: "./assets/images/char_cubito_explorer_jump.png",
  char_robo_block_idle: "./assets/images/char_robo_block_idle.png",
  char_robo_block_run: "./assets/images/char_robo_block_run.png",
  char_robo_block_jump: "./assets/images/char_robo_block_jump.png",
  char_pixel_cat_quad_idle: "./assets/images/char_pixel_cat_quad_idle.png",
  char_pixel_cat_quad_running: "./assets/images/char_pixel_cat_quad_running.png",
  char_pixel_cat_quad_jump: "./assets/images/char_pixel_cat_quad_jump.png"
};
var SPRITE_CONFIGS = {
  cubito: {
    idle: {
      imageUrl: "char_cubito_explorer_idle",
      totalFrames: 4,
      frameWidth: 512,
      frameHeight: 512,
      fps: 6,
      loop: true
    },
    run: {
      imageUrl: "char_cubito_explorer_run",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    },
    jump: {
      imageUrl: "char_cubito_explorer_jump",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    }
  },
  robo: {
    idle: {
      imageUrl: "char_robo_block_idle",
      totalFrames: 4,
      frameWidth: 512,
      frameHeight: 512,
      fps: 6,
      loop: true
    },
    run: {
      imageUrl: "char_robo_block_run",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    },
    jump: {
      imageUrl: "char_robo_block_jump",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    }
  },
  cat: {
    idle: {
      imageUrl: "char_pixel_cat_quad_idle",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 8,
      loop: true
    },
    run: {
      imageUrl: "char_pixel_cat_quad_running",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    },
    jump: {
      imageUrl: "char_pixel_cat_quad_jump",
      totalFrames: 16,
      frameWidth: 512,
      frameHeight: 512,
      fps: 16,
      loop: true
    }
  }
};
var DEFAULT_SETTINGS = {
  lang: "es",
  objectCount: 4,
  freezeCooldown: 5,
  enabledObjects: HIDING_OBJECTS.reduce(
    (acc, obj) => ({ ...acc, [obj.id]: true }),
    {}
  ),
  enabledCharacters: CHARACTERS.reduce(
    (acc, char) => ({ ...acc, [char.id]: true }),
    {}
  )
};
function App() {
  const canvasRef = useRef4(null);
  const stepperRef = useRef4();
  const isMobile = useIsMobile();
  const { sdk } = usePlayground();
  const [exitChat] = useRpc("ExitChat");
  const { assets, isReady: assetsReady } = useAssets(ASSETS_MANIFEST);
  const canvasWidth = getConfig("baseCanvasWidth");
  const canvasHeight = getConfig("baseCanvasHeight");
  if (!stepperRef.current) {
    const stepMs = getConfig("stepMs");
    const maxSubSteps = getConfig("maxSubSteps");
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }
  const [isMusicMuted, setIsMusicMuted] = useState4(false);
  const [isSfxMuted, setIsSfxMuted] = useState4(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState4(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState4(false);
  const [isAdminOpen, setIsAdminOpen] = useState4(false);
  const [settings, setSettings] = useState4(() => {
    try {
      const saved = localStorage.getItem("escondite_cubo_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
    }
    return DEFAULT_SETTINGS;
  });
  const settingsRef = useRef4(settings);
  settingsRef.current = settings;
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(
        "escondite_cubo_settings",
        JSON.stringify(newSettings)
      );
    } catch (e) {
    }
  };
  const [gameState, setGameState] = useState4({
    status: "START",
    score: 0,
    level: 1,
    roundsCompleted: 0
  });
  const gameStateRef = useRef4(gameState);
  gameStateRef.current = gameState;
  const [clueVisible, setClueVisible] = useState4(false);
  const [currentClueObject, setCurrentClueObject] = useState4(null);
  const [foundBannerVisible, setFoundBannerVisible] = useState4(false);
  const [foundCharacterName, setFoundCharacterName] = useState4("");
  const [freezeRemaining, setFreezeRemaining] = useState4(0);
  const spriteRenderersRef = useRef4({});
  if (Object.keys(spriteRenderersRef.current).length === 0) {
    Object.entries(SPRITE_CONFIGS).forEach(([key, configs]) => {
      spriteRenderersRef.current[key] = new SpriteRenderer(configs);
    });
  }
  const roundStateRef = useRef4({
    phase: "HIDING",
    character: CHARACTERS[0],
    targetObjectDef: HIDING_OBJECTS[0],
    charAnimState: { currentAction: "idle", currentFrame: 0, timer: 0 },
    charX: canvasWidth / 2 - 60,
    charY: canvasHeight - 200,
    charW: 120,
    charH: 120,
    charStartPos: { x: canvasWidth / 2 - 60, y: canvasHeight - 200 },
    charTargetPos: { x: 0, y: 0 },
    charProgress: 1,
    charFlipX: false,
    charBouncePhase: 0,
    hideTimer: 0,
    peekTimer: 0,
    peekInterval: 3,
    peekCount: 0,
    currentPeek: { active: false, type: "TOP", duration: 1.2, progress: 0, peekPercent: 0 },
    celebrationTimer: 0,
    freezeTimer: 0,
    freezeDuration: 5,
    frozenShake: 0,
    ambientSnowTimer: 0,
    objects: [],
    particles: [],
    missPuffs: [],
    timeInRound: 0
  });
  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight
  });
  const lastCancelRef = useRef4(false);
  const pointerHandledRef = useRef4(false);
  const spawnConfetti = useCallback2(
    (originX, originY, count = 50) => {
      const colors = [
        "#f59e0b",
        "#ec4899",
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#e11d48",
        "#06b6d4",
        "#facc15",
        "#ffffff"
      ];
      const newParticles = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 450;
        newParticles.push({
          x: originX + (Math.random() - 0.5) * 40,
          y: originY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 220,
          size: 8 + Math.random() * 12,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1,
          life: 0,
          maxLife: 1.8 + Math.random() * 1.2,
          shape: Math.random() > 0.4 ? "square" : "star"
        });
      }
      roundStateRef.current.particles.push(...newParticles);
    },
    []
  );
  const spawnIceBurst = useCallback2(
    (originX, originY, count = 20) => {
      const iceColors = [
        "#ffffff",
        "#e0f2fe",
        "#bae6fd",
        "#7dd3fc",
        "#38bdf8",
        "#0284c7",
        "#a5f3fc"
      ];
      const newParticles = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 320;
        newParticles.push({
          x: originX + (Math.random() - 0.5) * 20,
          y: originY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          size: 6 + Math.random() * 14,
          color: iceColors[Math.floor(Math.random() * iceColors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 10,
          alpha: 1,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.8,
          shape: Math.random() > 0.4 ? "crystal" : "snowflake"
        });
      }
      roundStateRef.current.particles.push(...newParticles);
    },
    []
  );
  const spawnMissPuff = useCallback2((x, y) => {
    roundStateRef.current.missPuffs.push({ x, y, timer: 0.6 });
  }, []);
  const generateObjectPlacements = useCallback2(
    (count, activeDefs) => {
      const clampedCount = Math.max(1, Math.min(count, activeDefs.length));
      const shuffledDefs = [...activeDefs].sort(() => Math.random() - 0.5);
      const chosenDefs = shuffledDefs.slice(0, clampedCount);
      const placements = [];
      const playXMin = 100;
      const playXMax = canvasWidth - 100;
      const playWidth = playXMax - playXMin;
      if (clampedCount === 1) {
        const def = chosenDefs[0];
        const w = 240;
        const h = 240;
        placements.push({
          def,
          x: canvasWidth / 2 - w / 2,
          y: 400,
          w,
          h,
          baseY: 400,
          shakeTimer: 0,
          bounceTimer: 0,
          isCorrect: false,
          revealed: false,
          hover: false
        });
      } else if (clampedCount <= 4) {
        const spacing = playWidth / clampedCount;
        chosenDefs.forEach((def, i) => {
          const w = 210;
          const h = 210;
          const staggerY = i % 2 * 50;
          const x = playXMin + spacing * i + (spacing - w) / 2;
          const y = 370 + staggerY;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false
          });
        });
      } else {
        const row1Count = Math.ceil(clampedCount / 2);
        const row2Count = clampedCount - row1Count;
        const row1Spacing = playWidth / row1Count;
        for (let i = 0; i < row1Count; i++) {
          const def = chosenDefs[i];
          const w = 180;
          const h = 180;
          const x = playXMin + row1Spacing * i + (row1Spacing - w) / 2;
          const y = 320 + i % 2 * 30;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false
          });
        }
        const row2Spacing = playWidth / row2Count;
        for (let i = 0; i < row2Count; i++) {
          const def = chosenDefs[row1Count + i];
          const w = 190;
          const h = 190;
          const x = playXMin + row2Spacing * i + (row2Spacing - w) / 2;
          const y = 460 + i % 2 * 25;
          placements.push({
            def,
            x,
            y,
            w,
            h,
            baseY: y,
            shakeTimer: 0,
            bounceTimer: 0,
            isCorrect: false,
            revealed: false,
            hover: false
          });
        }
      }
      return placements;
    },
    [canvasWidth]
  );
  const startNewRound = useCallback2(() => {
    const activeDefs = HIDING_OBJECTS.filter(
      (o) => settings.enabledObjects[o.id] !== false
    );
    const validDefs = activeDefs.length > 0 ? activeDefs : HIDING_OBJECTS;
    const activeChars = CHARACTERS.filter(
      (c) => settings.enabledCharacters[c.id] !== false
    );
    const validChars = activeChars.length > 0 ? activeChars : CHARACTERS;
    const chosenChar = validChars[Math.floor(Math.random() * validChars.length)];
    const placedObjs = generateObjectPlacements(
      settings.objectCount,
      validDefs
    );
    const targetIdx = Math.floor(Math.random() * placedObjs.length);
    placedObjs[targetIdx].isCorrect = true;
    const targetDef = placedObjs[targetIdx].def;
    const targetX = placedObjs[targetIdx].x + placedObjs[targetIdx].w / 2 - 60;
    const targetY = placedObjs[targetIdx].y + placedObjs[targetIdx].h / 2 - 40;
    const peekInterval = getConfig("peekIntervalSeconds") || 3;
    roundStateRef.current = {
      phase: "HIDING",
      character: chosenChar,
      targetObjectDef: targetDef,
      charAnimState: {
        currentAction: "idle",
        currentFrame: 0,
        timer: 0
      },
      charX: targetX,
      charY: targetY,
      charW: 120,
      charH: 120,
      charStartPos: { x: targetX, y: targetY },
      charTargetPos: { x: targetX, y: targetY },
      charProgress: 1,
      charFlipX: false,
      charBouncePhase: 0,
      hideTimer: 0,
      peekTimer: 0,
      peekInterval,
      peekCount: 0,
      currentPeek: { active: false, type: "TOP", duration: 1.2, progress: 0, peekPercent: 0 },
      celebrationTimer: 0,
      freezeTimer: 0,
      freezeDuration: settings.freezeCooldown || 5,
      frozenShake: 0,
      ambientSnowTimer: 0,
      objects: placedObjs,
      particles: [],
      missPuffs: [],
      timeInRound: 0
    };
    setClueVisible(false);
    setCurrentClueObject(targetDef);
    setFoundBannerVisible(false);
    setFreezeRemaining(0);
    setGameState((prev) => ({ ...prev, status: "PLAYING" }));
    gameAudio.playRetroJump();
  }, [canvasHeight, canvasWidth, generateObjectPlacements, settings]);
  const initGame = useCallback2(() => {
    setGameState({
      status: "PLAYING",
      score: 0,
      level: 1,
      roundsCompleted: 0
    });
    startNewRound();
    if (sdk && window.parent !== window) {
      try {
        sdk.startGame();
      } catch (error) {
        console.warn("No se pudo iniciar el SDK embebido.", error);
      }
    }
  }, [sdk, startNewRound]);
  const handleInteractionAt = useCallback2(
    (clickX, clickY) => {
      const round = roundStateRef.current;
      if (round.phase !== "HIDING") return;
      if (round.freezeTimer > 0) {
        spawnIceBurst(clickX, clickY, 14);
        round.frozenShake = 0.25;
        gameAudio.playShieldBlock();
        return;
      }
      const duration = settingsRef.current.freezeCooldown || getConfig("freezeCooldownSeconds") || 5;
      round.freezeTimer = duration;
      round.freezeDuration = duration;
      spawnIceBurst(clickX, clickY, 18);
      let hitAnyObject = false;
      for (let i = 0; i < round.objects.length; i++) {
        const obj = round.objects[i];
        const padding = 15;
        if (clickX >= obj.x - padding && clickX <= obj.x + obj.w + padding && clickY >= obj.y - padding && clickY <= obj.y + obj.h + padding) {
          hitAnyObject = true;
          if (obj.isCorrect) {
            round.phase = "CELEBRATING";
            round.celebrationTimer = 0;
            round.freezeTimer = 0;
            obj.revealed = true;
            obj.bounceTimer = 1;
            if (round.character.type === "spritesheet") {
              round.charAnimState.currentAction = "jump";
              round.charAnimState.currentFrame = 0;
              round.charAnimState.timer = 0;
            }
            spawnConfetti(obj.x + obj.w / 2, obj.y + obj.h / 2, 70);
            gameAudio.playVictoryFanfare();
            const pts = getConfig("pointsPerFind") || 100;
            setGameState((prev) => ({
              ...prev,
              score: prev.score + pts,
              roundsCompleted: (prev.roundsCompleted || 0) + 1
            }));
            const lang = settingsRef.current.lang;
            setFoundCharacterName(
              lang === "es" ? round.character.nameEs : round.character.nameEn
            );
            setFoundBannerVisible(true);
          } else {
            if (obj.shakeTimer <= 0) {
              obj.shakeTimer = 0.4;
              spawnMissPuff(obj.x + obj.w / 2, obj.y + obj.h / 2);
              gameAudio.playHoverMicroTone();
            }
          }
          break;
        }
      }
      if (!hitAnyObject) {
        gameAudio.playHoverMicroTone();
      }
    },
    [spawnConfetti, spawnIceBurst, spawnMissPuff]
  );
  const hasAutoplayed = useRef4(false);
  useEffect4(() => {
    if (!hasAutoplayed.current && new URLSearchParams(window.location.search).has("autoplay")) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);
  usePlaygroundGameLifecycle(gameState, sdk);
  const update = (deltaTime) => {
    if (gameState.status !== "PLAYING" || isGameMenuOpen || isHowToPlayOpen || isAdminOpen)
      return;
    const round = roundStateRef.current;
    round.timeInRound += deltaTime;
    const clueDelay = getConfig("clueDelaySeconds") || 10;
    if (round.timeInRound >= clueDelay && !clueVisible) {
      setClueVisible(true);
      gameAudio.playPowerupChime();
    }
    round.objects.forEach((obj, idx) => {
      if (obj.shakeTimer > 0) {
        obj.shakeTimer = Math.max(0, obj.shakeTimer - deltaTime);
      }
      if (obj.bounceTimer > 0) {
        obj.bounceTimer = Math.max(0, obj.bounceTimer - deltaTime);
      }
    });
    if (round.freezeTimer > 0) {
      round.freezeTimer = Math.max(0, round.freezeTimer - deltaTime);
      setFreezeRemaining(round.freezeTimer);
      round.ambientSnowTimer += deltaTime;
      if (round.ambientSnowTimer >= 0.08) {
        round.ambientSnowTimer = 0;
        const snowColors = ["#ffffff", "#e0f2fe", "#bae6fd", "#7dd3fc"];
        round.particles.push({
          x: Math.random() * canvasWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 40,
          vy: 60 + Math.random() * 80,
          size: 4 + Math.random() * 8,
          color: snowColors[Math.floor(Math.random() * snowColors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 4,
          alpha: 0.8,
          life: 0,
          maxLife: 4,
          shape: Math.random() > 0.5 ? "snowflake" : "crystal"
        });
      }
    } else if (freezeRemaining > 0) {
      setFreezeRemaining(0);
    }
    if (round.frozenShake > 0) {
      round.frozenShake = Math.max(0, round.frozenShake - deltaTime);
    }
    for (let i = round.particles.length - 1; i >= 0; i--) {
      const p = round.particles[i];
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        round.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      if (p.shape === "square" || p.shape === "star") {
        p.vy += 320 * deltaTime;
      } else {
        p.vy += 40 * deltaTime;
      }
      p.rotation += p.vRot * deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
    for (let i = round.missPuffs.length - 1; i >= 0; i--) {
      const puff = round.missPuffs[i];
      puff.timer -= deltaTime;
      if (puff.timer <= 0) {
        round.missPuffs.splice(i, 1);
      }
    }
    if (round.phase === "HIDING") {
      round.hideTimer += deltaTime;
      const peekingEnabled = getConfig("enablePeeking");
      if (peekingEnabled && round.timeInRound >= 10) {
        if (!round.currentPeek.active) {
          round.peekTimer += deltaTime;
          if (round.peekTimer >= round.peekInterval) {
            round.peekTimer = 0;
            round.peekCount += 1;
            const peekTypes = [
              "TOP",
              "LEFT",
              "RIGHT"
            ];
            const type = peekTypes[Math.floor(Math.random() * peekTypes.length)];
            round.currentPeek = {
              active: true,
              type,
              duration: 1.3,
              progress: 0,
              peekPercent: round.peekCount
            };
            gameAudio.playHoverMicroTone();
          }
        } else {
          round.currentPeek.progress += deltaTime / round.currentPeek.duration;
          if (round.currentPeek.progress >= 1) {
            round.currentPeek.active = false;
            round.currentPeek.progress = 0;
            round.peekInterval = 2 + Math.random() * 2;
          }
        }
      }
      if (round.character.type === "spritesheet") {
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          round.charAnimState = renderer.getNextState(
            round.charAnimState,
            deltaTime
          );
        }
      }
      const input = inputRef.current;
      if (input.pointer.down) {
        if (!pointerHandledRef.current) {
          pointerHandledRef.current = true;
          handleInteractionAt(input.pointer.x, input.pointer.y);
        }
      } else {
        pointerHandledRef.current = false;
      }
    } else if (round.phase === "CELEBRATING") {
      round.celebrationTimer += deltaTime;
      round.charBouncePhase += deltaTime * 10;
      if (round.character.type === "spritesheet") {
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          round.charAnimState = renderer.getNextState(
            round.charAnimState,
            deltaTime
          );
        }
      }
      if (Math.random() < 0.25) {
        const targetObj = round.objects.find((o) => o.isCorrect);
        if (targetObj) {
          spawnConfetti(
            targetObj.x + targetObj.w / 2 + (Math.random() - 0.5) * 80,
            targetObj.y - 40,
            4
          );
        }
      }
      if (round.celebrationTimer >= 3.8) {
        startNewRound();
      }
    }
  };
  const draw = (ctx) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);
    const round = roundStateRef.current;
    ctx.save();
    if (round.frozenShake > 0) {
      const shakeAmp = round.frozenShake / 0.25 * 8;
      const sx = (Math.random() - 0.5) * shakeAmp;
      const sy = (Math.random() - 0.5) * shakeAmp;
      ctx.translate(sx, sy);
    }
    drawBackground(
      ctx,
      assets["bg_playfield"],
      canvasWidth,
      canvasHeight,
      "#7dd3fc"
    );
    const renderCharacter = (cx, cy, cw, ch, alpha = 1, flipX = false) => {
      ctx.save();
      if (alpha < 1) {
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      }
      if (round.character.type === "static") {
        const dinoImg = assets[round.character.idleKey];
        const bounceScale = round.phase === "CELEBRATING" ? 1 + Math.sin(round.charBouncePhase) * 0.12 : 1;
        ctx.save();
        ctx.translate(cx + cw / 2, cy + ch / 2);
        if (flipX) ctx.scale(-1, 1);
        ctx.scale(bounceScale, 2 - bounceScale);
        drawAsset(
          ctx,
          dinoImg,
          -cw / 2,
          -ch / 2,
          cw,
          ch,
          (fctx) => {
            fctx.fillStyle = "#84cc16";
            fctx.beginPath();
            fctx.roundRect(-cw / 2, -ch / 2, cw, ch, 16);
            fctx.fill();
          }
        );
        ctx.restore();
      } else {
        const renderer = spriteRenderersRef.current[round.character.id];
        if (renderer) {
          renderer.draw(
            ctx,
            round.charAnimState,
            cx,
            cy,
            cw,
            ch,
            assets,
            flipX,
            alpha
          );
        }
      }
      ctx.restore();
    };
    if (round.phase === "HIDING") {
      const targetObj = round.objects.find((o) => o.isCorrect);
      if (targetObj && round.currentPeek.active) {
        const p = round.currentPeek;
        const peekOffsetFactor = Math.sin(p.progress * Math.PI);
        const peekFraction = Math.min(1, (p.peekPercent || 1) * 0.01);
        const currentReveal = peekFraction * peekOffsetFactor;
        let peekX = targetObj.x + targetObj.w / 2 - round.charW / 2;
        let peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;
        if (p.type === "TOP") {
          peekY = targetObj.y - round.charH * currentReveal;
          peekX = targetObj.x + targetObj.w / 2 - round.charW / 2;
        } else if (p.type === "LEFT") {
          peekX = targetObj.x - round.charW * currentReveal;
          peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;
        } else if (p.type === "RIGHT") {
          peekX = targetObj.x + targetObj.w - round.charW + round.charW * currentReveal;
          peekY = targetObj.y + targetObj.h / 2 - round.charH / 2;
        }
        renderCharacter(
          peekX,
          peekY,
          round.charW,
          round.charH,
          1,
          p.type === "LEFT"
        );
      }
    }
    round.objects.forEach((obj) => {
      ctx.save();
      let shakeX = 0;
      let shakeY = 0;
      if (obj.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * 18 * (obj.shakeTimer / 0.4);
      }
      let bounceScale = 1;
      if (obj.bounceTimer > 0) {
        const bt = 1 - obj.bounceTimer;
        bounceScale = 1 + Math.sin(bt * Math.PI * 3) * 0.15;
      }
      const drawX = obj.x + shakeX;
      const drawY = obj.y + shakeY;
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(
        drawX + obj.w / 2,
        drawY + obj.h - 10,
        obj.w * 0.44,
        18,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.translate(drawX + obj.w / 2, drawY + obj.h / 2);
      ctx.scale(bounceScale, bounceScale);
      const objImg = assets[obj.def.id];
      drawAsset(
        ctx,
        objImg,
        -obj.w / 2,
        -obj.h / 2,
        obj.w,
        obj.h,
        (fctx) => {
          fctx.fillStyle = obj.def.colors.primary.hex;
          fctx.beginPath();
          fctx.roundRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h, 24);
          fctx.fill();
        }
      );
      if (round.freezeTimer > 0) {
        const frostAlpha = Math.min(0.25, round.freezeTimer / (round.freezeDuration || 5) * 0.25);
        ctx.fillStyle = `rgba(186, 230, 253, ${frostAlpha})`;
        ctx.beginPath();
        ctx.roundRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h, 20);
        ctx.fill();
      }
      ctx.restore();
    });
    if (round.phase === "CELEBRATING") {
      const targetObj = round.objects.find((o) => o.isCorrect);
      if (targetObj) {
        const jumpY = targetObj.y - round.charH * 0.85 - Math.abs(Math.sin(round.charBouncePhase)) * 60;
        const jumpX = targetObj.x + targetObj.w / 2 - round.charW / 2;
        renderCharacter(
          jumpX,
          jumpY,
          round.charW,
          round.charH,
          1,
          false
        );
      }
    }
    round.missPuffs.forEach((puff) => {
      ctx.save();
      const alpha = Math.max(0, puff.timer / 0.6);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, 35 * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    round.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === "square") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === "star") {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            Math.cos((18 + i * 72) * Math.PI / 180) * p.size,
            -Math.sin((18 + i * 72) * Math.PI / 180) * p.size
          );
          ctx.lineTo(
            Math.cos((54 + i * 72) * Math.PI / 180) * (p.size / 2),
            -Math.sin((54 + i * 72) * Math.PI / 180) * (p.size / 2)
          );
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === "crystal") {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.shape === "snowflake") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = i * Math.PI / 3;
          const cos = Math.cos(angle) * p.size * 0.8;
          const sin = Math.sin(angle) * p.size * 0.8;
          ctx.moveTo(-cos, -sin);
          ctx.lineTo(cos, sin);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (round.freezeTimer > 0 && round.phase === "HIDING") {
      const freezeFraction = Math.max(
        0,
        Math.min(1, round.freezeTimer / (round.freezeDuration || 5))
      );
      ctx.save();
      const gradL = ctx.createLinearGradient(0, 0, 70, 0);
      gradL.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradL.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = gradL;
      ctx.fillRect(0, 0, 70, canvasHeight);
      const gradR = ctx.createLinearGradient(canvasWidth, 0, canvasWidth - 70, 0);
      gradR.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradR.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = gradR;
      ctx.fillRect(canvasWidth - 70, 0, 70, canvasHeight);
      const gradT = ctx.createLinearGradient(0, 0, 0, 70);
      gradT.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradT.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = gradT;
      ctx.fillRect(0, 0, canvasWidth, 70);
      const gradB = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - 70);
      gradB.addColorStop(0, `rgba(186, 230, 253, ${0.45 * freezeFraction})`);
      gradB.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = gradB;
      ctx.fillRect(0, canvasHeight - 70, canvasWidth, 70);
      const drawCornerIce = (cx, cy, rot) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = `rgba(224, 242, 254, ${0.75 * freezeFraction})`;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * freezeFraction})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(55, 12);
        ctx.lineTo(85, 0);
        ctx.lineTo(55, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(35, 28);
        ctx.lineTo(55, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(35, -28);
        ctx.lineTo(55, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      drawCornerIce(0, 0, Math.PI * 0.25);
      drawCornerIce(canvasWidth, 0, Math.PI * 0.75);
      drawCornerIce(canvasWidth, canvasHeight, -Math.PI * 0.75);
      drawCornerIce(0, canvasHeight, -Math.PI * 0.25);
      const barW = 320;
      const barH = 46;
      const barX = canvasWidth / 2 - barW / 2;
      const barY = 28;
      ctx.shadowColor = "rgba(56, 189, 248, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 23);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const fillW = Math.max(0, (barW - 12) * freezeFraction);
      const fillGrad = ctx.createLinearGradient(barX + 6, barY + 6, barX + 6 + fillW, barY + 6);
      fillGrad.addColorStop(0, "#0284c7");
      fillGrad.addColorStop(0.5, "#38bdf8");
      fillGrad.addColorStop(1, "#e0f2fe");
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(barX + 6, barY + 6, fillW, barH - 12, 17);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Fredoka', 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = settings.lang === "es" ? `\u2744\uFE0F \xA1CONGELADO! ${round.freezeTimer.toFixed(1)}s` : `\u2744\uFE0F FROZEN! ${round.freezeTimer.toFixed(1)}s`;
      ctx.fillText(label, canvasWidth / 2, barY + barH / 2);
      ctx.restore();
    }
    ctx.restore();
  };
  const updateRef = useRef4(update);
  const drawRef = useRef4(draw);
  updateRef.current = update;
  drawRef.current = draw;
  useEffect4(() => {
    let raf = 0;
    const loop = (time) => {
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          if (gameStateRef.current.status === "PLAYING") {
            setIsGameMenuOpen((prev) => !prev);
          } else if (gameStateRef.current.status === "START") {
            void exitChat({});
          }
        }
        lastCancelRef.current = cancelPressed;
      }
      stepperRef.current?.(time, (dt) => updateRef.current(dt));
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawRef.current(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat]);
  const isMusicPlaying = gameState.status === "PLAYING" && !isMusicMuted && !isGameMenuOpen;
  const startButtonRef = useAutoFocus(
    gameState.status === "START"
  );
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: "fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-center bg-slate-950 text-white select-none",
      style: { fontFamily: THEME.fontFamily },
      children: [
        !assetsReady && /* @__PURE__ */ jsxs2("div", { className: "absolute inset-0 z-50 flex flex-col items-center justify-center bg-sky-900 text-white", children: [
          /* @__PURE__ */ jsx3(Sparkles, { className: "w-16 h-16 text-yellow-300 animate-spin mb-4" }),
          /* @__PURE__ */ jsx3("h2", { className: "text-2xl md:text-3xl font-black text-yellow-300", children: "Cargando el Escondite..." }),
          /* @__PURE__ */ jsx3("p", { className: "text-sky-200 mt-2", children: "Loading adorable buddies..." })
        ] }),
        /* @__PURE__ */ jsx3(
          BackgroundMusic_default,
          {
            url: BACKGROUND_MUSIC_URL,
            isPlaying: isMusicPlaying,
            isMuted: isMusicMuted
          }
        ),
        /* @__PURE__ */ jsxs2("header", { className: "w-full bg-slate-900/90 backdrop-blur border-b border-slate-700/60 flex items-center justify-between px-3 py-2 z-20 shrink-0", children: [
          /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-amber-300 text-xs md:text-sm font-bold shadow-inner", children: [
              /* @__PURE__ */ jsx3(Trophy, { size: 16, className: "text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsxs2("span", { children: [
                settings.lang === "es" ? "Puntos" : "Score",
                ":",
                " ",
                /* @__PURE__ */ jsx3("span", { className: "text-amber-200 text-sm md:text-base font-black", children: gameState.score })
              ] })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "hidden sm:flex items-center gap-1.5 bg-sky-500/20 border border-sky-400/40 rounded-full px-3 py-1 text-sky-300 text-xs md:text-sm font-semibold", children: [
              /* @__PURE__ */ jsx3(Sparkles, { size: 15, className: "text-sky-400 shrink-0" }),
              /* @__PURE__ */ jsxs2("span", { children: [
                settings.lang === "es" ? "Ronda" : "Round",
                ":",
                " ",
                /* @__PURE__ */ jsx3("span", { className: "text-white font-bold", children: (gameState.roundsCompleted || 0) + 1 })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx3("div", { className: "flex-1 max-w-md mx-2 flex items-center justify-center", children: clueVisible && currentClueObject ? /* @__PURE__ */ jsx3("div", { className: "animate-bounce bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-0.5 rounded-full shadow-lg", children: /* @__PURE__ */ jsxs2("div", { className: "bg-slate-900/95 rounded-full px-3 py-1 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx3(Eye, { size: 15, className: "text-amber-400 shrink-0 animate-pulse" }),
            /* @__PURE__ */ jsx3("span", { className: "text-[11px] md:text-xs font-bold text-yellow-300", children: settings.lang === "es" ? "Pista:" : "Clue:" }),
            /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx3(
                "span",
                {
                  className: "inline-block w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm",
                  style: {
                    backgroundColor: currentClueObject.colors.primary.hex
                  }
                }
              ),
              /* @__PURE__ */ jsx3("span", { className: "text-[10px] md:text-xs font-semibold text-white truncate max-w-[80px] md:max-w-none", children: settings.lang === "es" ? currentClueObject.colors.primary.nameEs : currentClueObject.colors.primary.nameEn }),
              /* @__PURE__ */ jsx3("span", { className: "text-slate-500 text-[10px]", children: "&" }),
              /* @__PURE__ */ jsx3(
                "span",
                {
                  className: "inline-block w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm",
                  style: {
                    backgroundColor: currentClueObject.colors.secondary.hex
                  }
                }
              ),
              /* @__PURE__ */ jsx3("span", { className: "text-[10px] md:text-xs font-semibold text-white truncate max-w-[80px] md:max-w-none", children: settings.lang === "es" ? currentClueObject.colors.secondary.nameEs : currentClueObject.colors.secondary.nameEn })
            ] })
          ] }) }) : /* @__PURE__ */ jsxs2("div", { className: "text-[11px] md:text-xs text-slate-300 flex items-center gap-1 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50", children: [
            /* @__PURE__ */ jsx3(Eye, { size: 13, className: "text-sky-400" }),
            /* @__PURE__ */ jsx3("span", { children: settings.lang === "es" ? "\xA1Observa bien d\xF3nde se esconden!" : "Look closely where they hide!" })
          ] }) }),
          /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsAdminOpen(true);
                },
                title: "Ajustes / Admin",
                className: "min-w-[40px] min-h-[40px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 rounded-full border border-slate-700 flex items-center justify-center transition-transform",
                children: /* @__PURE__ */ jsx3(Sliders, { size: 18 })
              }
            ),
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                },
                title: "C\xF3mo Jugar / How to play",
                className: "min-w-[40px] min-h-[40px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 rounded-full border border-slate-700 flex items-center justify-center transition-transform",
                children: /* @__PURE__ */ jsx3(HelpCircle, { size: 18 })
              }
            ),
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(true);
                },
                title: "Men\xFA",
                className: "min-w-[44px] min-h-[44px] px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-full shadow-md flex items-center justify-center gap-1 text-xs md:text-sm transition-transform",
                children: [
                  /* @__PURE__ */ jsx3("span", { children: "\u2261" }),
                  /* @__PURE__ */ jsx3("span", { className: "hidden xs:inline", children: settings.lang === "es" ? "Men\xFA" : "Menu" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("main", { className: "flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950", children: [
          /* @__PURE__ */ jsx3(
            "canvas",
            {
              ref: canvasRef,
              width: canvasWidth,
              height: canvasHeight,
              style: {
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
                touchAction: "none"
              },
              className: `h-auto max-w-full max-h-full drop-shadow-2xl shadow-2xl cursor-pointer select-none ${!assetsReady ? "invisible" : ""}`
            }
          ),
          foundBannerVisible && /* @__PURE__ */ jsx3("div", { className: "absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce flex flex-col items-center", children: /* @__PURE__ */ jsxs2("div", { className: "bg-gradient-to-r from-emerald-500 to-teal-600 border-2 border-yellow-300 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3", children: [
            /* @__PURE__ */ jsx3(Sparkles, { className: "w-6 h-6 text-yellow-300 animate-spin" }),
            /* @__PURE__ */ jsx3("span", { className: "text-lg md:text-2xl font-black text-white drop-shadow", children: settings.lang === "es" ? `\xA1Encontraste a ${foundCharacterName}!` : `You found ${foundCharacterName}!` }),
            /* @__PURE__ */ jsxs2("span", { className: "bg-yellow-400 text-slate-950 text-xs md:text-sm font-black px-2 py-0.5 rounded-full", children: [
              "+",
              getConfig("pointsPerFind"),
              " pts"
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs2("footer", { className: "w-full bg-slate-900/80 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 z-10 shrink-0", children: [
          /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx3("span", { className: "inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" }),
            /* @__PURE__ */ jsx3("span", { children: isMobile ? settings.lang === "es" ? "Toca un escondite para buscar" : "Tap a hiding spot to search" : settings.lang === "es" ? "Haz clic en un objeto para buscar" : "Click an object to search" })
          ] }),
          gameState.status === "PLAYING" && /* @__PURE__ */ jsxs2(
            "button",
            {
              onClick: () => {
                gameAudio.playCrispClick();
                startNewRound();
              },
              className: "min-w-[48px] min-h-[36px] px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-yellow-400 font-bold rounded-full border border-slate-700 flex items-center gap-1.5 text-xs transition-transform",
              children: [
                /* @__PURE__ */ jsx3("span", { children: settings.lang === "es" ? "Siguiente" : "Next" }),
                /* @__PURE__ */ jsx3(ArrowRight, { size: 14 })
              ]
            }
          )
        ] }),
        gameState.status === "START" && /* @__PURE__ */ jsx3(MenuOverlay, { tone: "neutral", zIndex: 50, children: /* @__PURE__ */ jsxs2("div", { className: "w-full max-w-md bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center backdrop-blur", children: [
          /* @__PURE__ */ jsx3("div", { className: "w-20 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-inner", children: "\u{1F381}" }),
          /* @__PURE__ */ jsx3("h1", { className: "text-3xl md:text-4xl font-black text-amber-400 mb-2 drop-shadow", children: "ESCONDITE CUBO" }),
          /* @__PURE__ */ jsx3("p", { className: "text-slate-300 text-sm md:text-base mb-6 leading-relaxed", children: settings.lang === "es" ? "\xA1Encuentra a tus tiernos amigos c\xFAbicos que se esconden en la pradera!" : "Find adorable blocky friends hiding across the sunny meadow!" }),
          /* @__PURE__ */ jsxs2(
            "button",
            {
              ref: startButtonRef,
              autoFocus: true,
              onClick: () => {
                gameAudio.resume();
                gameAudio.playCrispClick();
                initGame();
              },
              className: "w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 px-6 py-3 rounded-full font-black text-lg md:text-xl transition-all shadow-lg flex items-center justify-center gap-2 mb-3 cursor-pointer",
              children: [
                /* @__PURE__ */ jsx3(Play, { size: 22, className: "fill-current" }),
                settings.lang === "es" ? "\xA1JUGAR AHORA!" : "PLAY NOW!"
              ]
            }
          ),
          /* @__PURE__ */ jsxs2("div", { className: "flex gap-2 w-full", children: [
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.resume();
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                },
                className: "flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl font-bold text-xs md:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx3(HelpCircle, { size: 16 }),
                  settings.lang === "es" ? "C\xF3mo Jugar" : "How to Play"
                ]
              }
            ),
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.resume();
                  gameAudio.playCrispClick();
                  setIsAdminOpen(true);
                },
                className: "flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs md:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx3(Sliders, { size: 16 }),
                  settings.lang === "es" ? "Ajustes / Admin" : "Admin Settings"
                ]
              }
            )
          ] })
        ] }) }),
        isGameMenuOpen && /* @__PURE__ */ jsx3(MenuOverlay, { tone: "neutral", zIndex: 60, children: /* @__PURE__ */ jsxs2("div", { className: "w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center", children: [
          /* @__PURE__ */ jsxs2("h2", { className: "text-2xl md:text-3xl font-black text-amber-400 mb-6 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx3("span", { children: "\u{1F3AE}" }),
            /* @__PURE__ */ jsx3("span", { children: settings.lang === "es" ? "Men\xFA del Juego" : "Game Menu" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "w-full flex flex-col gap-3 mb-6", children: [
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                },
                className: "w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base transition-transform",
                children: [
                  /* @__PURE__ */ jsx3(Play, { size: 20, className: "fill-current" }),
                  settings.lang === "es" ? "Reanudar" : "Resume"
                ]
              }
            ),
            /* @__PURE__ */ jsxs2("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs2(
                "button",
                {
                  onClick: () => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  },
                  className: `min-h-[48px] px-3 py-2 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${isSfxMuted ? "bg-red-900/40 border-red-700 text-red-300" : "bg-slate-800 border-slate-700 text-emerald-400"}`,
                  children: [
                    isSfxMuted ? /* @__PURE__ */ jsx3(VolumeX, { size: 18 }) : /* @__PURE__ */ jsx3(Volume2, { size: 18 }),
                    /* @__PURE__ */ jsxs2("span", { children: [
                      "SFX: ",
                      isSfxMuted ? "Off" : "On"
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs2(
                "button",
                {
                  onClick: () => setIsMusicMuted((prev) => !prev),
                  className: `min-h-[48px] px-3 py-2 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${isMusicMuted ? "bg-red-900/40 border-red-700 text-red-300" : "bg-slate-800 border-slate-700 text-emerald-400"}`,
                  children: [
                    /* @__PURE__ */ jsx3(Music, { size: 18 }),
                    /* @__PURE__ */ jsxs2("span", { children: [
                      settings.lang === "es" ? "M\xFAsica" : "Music",
                      ":",
                      " ",
                      isMusicMuted ? "Off" : "On"
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  startNewRound();
                },
                className: "w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-yellow-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-transform",
                children: [
                  /* @__PURE__ */ jsx3(RotateCw, { size: 18 }),
                  settings.lang === "es" ? "Reiniciar Ronda Actual" : "Restart Current Round"
                ]
              }
            ),
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => setIsHowToPlayOpen(true),
                className: "w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-transform",
                children: [
                  /* @__PURE__ */ jsx3(HelpCircle, { size: 18 }),
                  settings.lang === "es" ? "C\xF3mo Jugar" : "How to Play"
                ]
              }
            ),
            /* @__PURE__ */ jsxs2(
              "button",
              {
                onClick: () => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({ ...prev, status: "START" }));
                },
                className: "w-full min-h-[48px] bg-rose-900/50 hover:bg-rose-900 text-rose-200 font-bold rounded-xl border border-rose-800 flex items-center justify-center gap-2 text-sm transition-colors",
                children: [
                  /* @__PURE__ */ jsx3(Home, { size: 18 }),
                  settings.lang === "es" ? "Volver al Inicio" : "Quit to Title"
                ]
              }
            )
          ] })
        ] }) }),
        isHowToPlayOpen && /* @__PURE__ */ jsx3(MenuOverlay, { tone: "neutral", zIndex: 70, children: /* @__PURE__ */ jsxs2("div", { className: "w-full max-w-md bg-slate-900 border-2 border-sky-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center", children: [
          /* @__PURE__ */ jsxs2("div", { className: "w-full flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsxs2("h2", { className: "text-xl md:text-2xl font-black text-sky-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx3(HelpCircle, { size: 24 }),
              settings.lang === "es" ? "C\xF3mo Jugar" : "How to Play"
            ] }),
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: () => setIsHowToPlayOpen(false),
                className: "p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white",
                children: /* @__PURE__ */ jsx3(X, { size: 20 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "space-y-4 text-xs md:text-sm text-slate-300 mb-6 text-left w-full", children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50", children: [
              /* @__PURE__ */ jsx3("div", { className: "p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 text-xl", children: "\u{1F381}" }),
              /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx3("h3", { className: "font-bold text-white mb-1", children: settings.lang === "es" ? "1. Ya est\xE1 oculto" : "1. Instantly Hidden" }),
                /* @__PURE__ */ jsx3("p", { children: settings.lang === "es" ? "Tu amigo c\xFAbico ya est\xE1 escondido detr\xE1s de uno de los objetos desde el inicio de la ronda." : "Your blocky buddy is secretly hidden behind one of the objects right from the start." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50", children: [
              /* @__PURE__ */ jsx3("div", { className: "p-2 bg-pink-500/20 text-pink-400 rounded-lg shrink-0 text-xl", children: "\u{1FAE3}" }),
              /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx3("h3", { className: "font-bold text-white mb-1", children: settings.lang === "es" ? "2. Asomadas progresivas" : "2. Progressive Peeks" }),
                /* @__PURE__ */ jsx3("p", { children: settings.lang === "es" ? "Durante los primeros 10 segundos permanece 100% oculto. Luego, \xA1se asoma poco a poco (+1% cada vez: 1%, 2%, 3%...) con pistas de color!" : "For the first 10s they stay 100% concealed. After 10s, they peek out (+1% more each time: 1%, 2%, 3%...) with color clues!" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "flex gap-3 items-start bg-slate-800/60 p-3 rounded-xl border border-slate-700/50", children: [
              /* @__PURE__ */ jsx3("div", { className: "p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 text-xl", children: "\u{1F389}" }),
              /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx3("h3", { className: "font-bold text-white mb-1", children: settings.lang === "es" ? "3. Toca y celebra" : "3. Tap to Reveal" }),
                /* @__PURE__ */ jsx3("p", { children: settings.lang === "es" ? "Toca el objeto donde crees que est\xE1. \xA1Si fallas no pierdes nada, sigue explorando hasta encontrarlo!" : "Tap the hiding object to celebrate with confetti and stars. No stress, explore freely!" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx3(
            "button",
            {
              onClick: () => setIsHowToPlayOpen(false),
              className: "w-full min-h-[48px] bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-base shadow-md transition-colors",
              children: settings.lang === "es" ? "\xA1Entendido!" : "Got it!"
            }
          )
        ] }) }),
        isAdminOpen && /* @__PURE__ */ jsx3(MenuOverlay, { tone: "neutral", zIndex: 80, children: /* @__PURE__ */ jsxs2("div", { className: "w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center", children: [
          /* @__PURE__ */ jsxs2("div", { className: "w-full flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsxs2("h2", { className: "text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx3(Sliders, { size: 22 }),
              settings.lang === "es" ? "Panel de Ajustes" : "Admin & Settings"
            ] }),
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: () => setIsAdminOpen(false),
                className: "p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white",
                children: /* @__PURE__ */ jsx3(X, { size: 20 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "w-full space-y-5 text-left text-xs md:text-sm mb-6 max-h-[60vh] overflow-y-auto pr-1", children: [
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("label", { className: "block text-slate-300 font-bold mb-2", children: settings.lang === "es" ? "Idioma / Language" : "Language" }),
              /* @__PURE__ */ jsxs2("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx3(
                  "button",
                  {
                    onClick: () => saveSettings({ ...settings, lang: "es" }),
                    className: `min-h-[44px] py-2 rounded-xl font-bold border transition-colors ${settings.lang === "es" ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-800 text-slate-300 border-slate-700"}`,
                    children: "\u{1F1F2}\u{1F1FD} Espa\xF1ol"
                  }
                ),
                /* @__PURE__ */ jsx3(
                  "button",
                  {
                    onClick: () => saveSettings({ ...settings, lang: "en" }),
                    className: `min-h-[44px] py-2 rounded-xl font-bold border transition-colors ${settings.lang === "en" ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-800 text-slate-300 border-slate-700"}`,
                    children: "\u{1F1FA}\u{1F1F8} English"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsxs2("div", { className: "flex justify-between items-center mb-2", children: [
                /* @__PURE__ */ jsx3("span", { className: "text-slate-300 font-bold", children: settings.lang === "es" ? "Objetos por Ronda" : "Objects per Round" }),
                /* @__PURE__ */ jsx3("span", { className: "text-amber-400 font-black text-base", children: settings.objectCount })
              ] }),
              /* @__PURE__ */ jsx3("div", { className: "flex items-center gap-1.5 justify-between", children: [1, 2, 3, 4, 5, 6, 7, 8].map((num) => /* @__PURE__ */ jsx3(
                "button",
                {
                  onClick: () => saveSettings({ ...settings, objectCount: num }),
                  className: `min-w-[36px] min-h-[36px] rounded-lg font-bold transition-transform ${settings.objectCount === num ? "bg-amber-500 text-slate-950 scale-110 shadow" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"}`,
                  children: num
                },
                num
              )) })
            ] }),
            /* @__PURE__ */ jsxs2("div", { className: "bg-slate-800/70 p-3 rounded-xl border border-cyan-500/30", children: [
              /* @__PURE__ */ jsxs2("div", { className: "flex justify-between items-center mb-2", children: [
                /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 text-cyan-300 font-bold", children: [
                  /* @__PURE__ */ jsx3(Snowflake, { size: 16, className: "text-cyan-400" }),
                  /* @__PURE__ */ jsx3("span", { children: settings.lang === "es" ? "Tiempo de Congelaci\xF3n (Clics)" : "Freeze Cooldown (Clicks)" })
                ] }),
                /* @__PURE__ */ jsxs2("span", { className: "bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/40 font-black text-sm", children: [
                  settings.freezeCooldown.toFixed(1),
                  "s"
                ] })
              ] }),
              /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-5 gap-1.5 mb-2.5", children: [1, 2, 3, 5, 10].map((sec) => /* @__PURE__ */ jsxs2(
                "button",
                {
                  onClick: () => saveSettings({ ...settings, freezeCooldown: sec }),
                  className: `min-h-[34px] rounded-lg font-bold text-xs transition-all ${Math.abs(settings.freezeCooldown - sec) < 0.1 ? "bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/30" : "bg-slate-900/80 text-cyan-200/80 border border-slate-700 hover:border-cyan-500"}`,
                  children: [
                    sec,
                    "s"
                  ]
                },
                sec
              )) }),
              /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx3(
                  "button",
                  {
                    onClick: () => saveSettings({
                      ...settings,
                      freezeCooldown: Math.max(1, settings.freezeCooldown - 0.5)
                    }),
                    className: "min-w-[32px] min-h-[32px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black rounded-lg flex items-center justify-center",
                    children: "-"
                  }
                ),
                /* @__PURE__ */ jsx3(
                  "input",
                  {
                    type: "range",
                    min: "1.0",
                    max: "10.0",
                    step: "0.5",
                    value: settings.freezeCooldown,
                    onChange: (e) => saveSettings({
                      ...settings,
                      freezeCooldown: parseFloat(e.target.value)
                    }),
                    className: "flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg appearance-none"
                  }
                ),
                /* @__PURE__ */ jsx3(
                  "button",
                  {
                    onClick: () => saveSettings({
                      ...settings,
                      freezeCooldown: Math.min(10, settings.freezeCooldown + 0.5)
                    }),
                    className: "min-w-[32px] min-h-[32px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black rounded-lg flex items-center justify-center",
                    children: "+"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx3("p", { className: "text-[11px] text-slate-400 mt-2", children: settings.lang === "es" ? "Bloquea la interacci\xF3n durante este tiempo tras cada toque." : "Locks clicks for this duration after each interaction." })
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("span", { className: "block text-slate-300 font-bold mb-2", children: settings.lang === "es" ? "Personajes Activos" : "Active Characters" }),
              /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-2 gap-2", children: CHARACTERS.map((char) => {
                const isEnabled = settings.enabledCharacters[char.id] !== false;
                return /* @__PURE__ */ jsxs2(
                  "button",
                  {
                    onClick: () => {
                      const updated = {
                        ...settings.enabledCharacters,
                        [char.id]: !isEnabled
                      };
                      if (Object.values(updated).some(Boolean)) {
                        saveSettings({
                          ...settings,
                          enabledCharacters: updated
                        });
                      }
                    },
                    className: `min-h-[44px] p-2 rounded-xl font-bold flex items-center justify-between border text-xs transition-colors ${isEnabled ? "bg-slate-800 border-emerald-500 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"}`,
                    children: [
                      /* @__PURE__ */ jsx3("span", { children: settings.lang === "es" ? char.nameEs : char.nameEn }),
                      isEnabled && /* @__PURE__ */ jsx3(Check, { size: 16, className: "text-emerald-400 shrink-0" })
                    ]
                  },
                  char.id
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("span", { className: "block text-slate-300 font-bold mb-2", children: settings.lang === "es" ? "Escondites Disponibles" : "Available Hiding Spots" }),
              /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-2 gap-2", children: HIDING_OBJECTS.map((obj) => {
                const isEnabled = settings.enabledObjects[obj.id] !== false;
                return /* @__PURE__ */ jsxs2(
                  "button",
                  {
                    onClick: () => {
                      const updated = {
                        ...settings.enabledObjects,
                        [obj.id]: !isEnabled
                      };
                      if (Object.values(updated).some(Boolean)) {
                        saveSettings({
                          ...settings,
                          enabledObjects: updated
                        });
                      }
                    },
                    className: `min-h-[44px] p-2 rounded-xl font-bold flex items-center justify-between border text-xs transition-colors ${isEnabled ? "bg-slate-800 border-amber-500 text-amber-200" : "bg-slate-900 border-slate-800 text-slate-500"}`,
                    children: [
                      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 truncate", children: [
                        /* @__PURE__ */ jsx3(
                          "span",
                          {
                            className: "w-2.5 h-2.5 rounded-full shrink-0",
                            style: { backgroundColor: obj.colors.primary.hex }
                          }
                        ),
                        /* @__PURE__ */ jsx3("span", { className: "truncate", children: settings.lang === "es" ? obj.nameEs : obj.nameEn })
                      ] }),
                      isEnabled && /* @__PURE__ */ jsx3(Check, { size: 14, className: "text-amber-400 shrink-0" })
                    ]
                  },
                  obj.id
                );
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx3(
            "button",
            {
              onClick: () => {
                gameAudio.playCrispClick();
                setIsAdminOpen(false);
                startNewRound();
              },
              className: "w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-base shadow-md transition-all",
              children: settings.lang === "es" ? "Guardar y Nueva Ronda" : "Save & Start Round"
            }
          )
        ] }) })
      ]
    }
  );
}

// ESCONDIDA2/index.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
var root = createRoot(document.getElementById("root"));
root.render(
  /* @__PURE__ */ jsx4(
    "div",
    {
      style: {
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden"
      },
      children: /* @__PURE__ */ jsx4(App, {})
    }
  )
);
