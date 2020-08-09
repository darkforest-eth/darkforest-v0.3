# Dark Forest - Smart Contract

## Key Architectural Consideration

We want to build a smartcontract that is:

- Modular
- Upgradable
- Interoperable

Therefore, one of the key components that needs to be taken into account is a good separation of concerns between each contract.

We use OpenZeppelin's upgradeable smart contract system that allows for easy upgradability with the tradeoff working behind some layer of abstractions.

OpenZeppelin SDK comes with own testing and deployment suite therefore it is not necessary for us to use Truffle anymore.

## Publicly Exposed Function Specification

### Refresh Planet

`refreshPlanet(uint256 _location)`

**Description:** Forces execution of lazy updates on a planet: applies events and natural growth/decay of population up to current block time.

**Input**:

- **uint256 \_location**: Planet ID to update.

**Throws:**

- **"DarkForestCore: planet has not been initialized"**: Planet with ID \_location has not yet been initialized.

**Emits: none**

### Initialize Player

`initializePlayer(uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c, uint256[3] memory _input)`

**Description:** Assigns msg.sender a home planet.

**Input**:

- **uint256[2] \_a**: Used for ZKP verification.
- **uint256[2][2] \_b:** Used for ZKP verification.
- **uint256[2] \_c**: Used for ZKP verification.
- **uint256[3] \_input**
  - **\_input[0]**: The Planet ID to initialize at.
  - **\_input[1]**: The claimed perlin value at the above planet ID.
  - **\_input[2]**: An upper bound (inclusive) on the distance of the planet from (0, 0).

**Throws:**

- **"Failed init proof check"**: ZK proofs did not verify.
- **"Player is already initialized"**: msg.sender has successfully initialized before.
- **"Planet is already initialized"**: Planet with ID has already been initialized.
- **"Not a valid planet location"**: Planet does not yet exist in contract, but its ID is not a valid planet ID. (via `_initializePlanet`)
- **"Can only initialize on planet level 0"**: Planet is not level 0.
- **"Init radius is bigger than the current world radius"**: Player is trying to initialize on a planet outside of current world bounds.
- **"Init not allowed in perlin value above the threshold"**: Player is trying to initialize in deep space, i.e. perlin value is at least the deep space threshold.

**Emits:**

- **PlayerInitialized(player, planetId)**
  - **player**: msg.sender
  - **planetId**: home planet ID

### Move

`move (uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c, uint256[7] memory _input)`

**Description:** Initiate a move between two planets.

**Input**:

- **uint256[2] \_a**: Used for ZKP verification.
- **uint256[2][2] \_b:** Used for ZKP verification.
- **uint256[2] \_c**: Used for ZKP verification.
- **uint256[7] \_input**
  - **\_input[0]**: Planet ID player is moving from.
  - **\_input[1]**: Planet ID player is moving to.
  - **\_input[2]**: The perlin value at the destination planet.
  - **\_input[3]**: An upper bound (inclusive) on the distance of destination planet from the origin.
  - **\_input[4]**: An upper bound (inclusive) on the distance between the two planets.
  - **\_input[5]**: The population being sent.
  - **\_input[6]**: The silver being sent.

**Throws:**

- **"Failed move proof check"**: ZK proofs did not verify.
- **"Attempting to move out of bounds"**: Destination is outside of current world bounds.
- **"Planet is rate-limited"**: Destination planet has too many pending arrivals (more than 8 outstanding arrivals). We revert here to avoid exploitation of a quadratic gas vulnerability with the lazy-updating system.
- **"Not a valid planet location"**: Destination planet does not yet exist in contract, but its ID is not a valid planet ID. (via `_initializePlanet`)
- **"Only owner can perform operation on planets"**: Attempting to move from a planet that player does not own.
- **"Tried to move more population what exists"**: Attempting to move more population than planet currently has.
- **"Tried to move more silver than what exists"**: Attempting to move more silver than the planet currently has.
- **"Not enough forces to make move"**: After applying the move decay, forces arriving is 0 or less.

**Emits:**

- **ArrivalQueued(arrivalID)**
  - **arrivalId**: ID of the new arrival initiated

### Upgrade Planet

upgradePlanet`(uint256 _location, uint256 upgradeBranch)`

takes as input: planet, upgrade branch

**Description**: Upgrades a planet, improving its stats

**Inputs**:

- **uint256 \_location:** ID of planet to upgrade on
- **uint256 upgradeBranch:** branch to upgrade on (0, 1, or 2)

**Throws:**

- **"Planet is not initialized"**: Attempting to upgrade a planet that has not yet been initialized
- **"Only owner can perform operation on planets"**: Attempting to upgrade a planet that player does not own.
- **"Planet level is not high enough for this upgrade"**: Can't upgrade level 0 planets.
- **"Upgrade branch not valid"**: `upgradeBranch` is not 0, 1, or 2
- **"Upgrade branch already maxed"**: Attempting to upgrade a planet along a branch that is already fully upgraded
- **"Can't upgrade a third branch to level 3"**: Attempting to upgrade a branch to level 3, when two branches have already achieved level 3
- **"Insufficient silver to upgrade":** Planet does not have enough silver to perform upgrade.

**Emits:**

- **PlanetUpgraded(\_location)**
  - **\_location**: ID of the upgraded planet
