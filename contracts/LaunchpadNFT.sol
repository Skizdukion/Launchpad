//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IWineryNFT {
    function launchpadMint(
        address to,
        uint256 level,
        uint256 robiBoost,
        bool freeze
    ) external returns (uint256 id);
}

contract LaunchpadNFT is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {

    // ROLES
    bytes32 public constant USER_ACTION_ROLE = keccak256("USER_ACTION_ROLE");
    bytes32 public constant ADMIN_ACTION_ROLE = keccak256("ADMIN_ACTION_ROLE");

    using SafeERC20 for IERC20;

    IWineryNFT wineryNFT;
    address payable public treasuryAddress;
    uint256 public historyLength = 0;
    address public usdt = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    bool public paused = false;
    uint32 public maxToUser = 1;

    enum OwnBy {
        Buy,
        Receive
    }

    struct Launchpad {
        uint256 priceInUSD;
        uint256 robiBoost;
        uint32 totalCount;
        uint32 soldCount;
        uint32 sendCount;
        uint32 level;
    }
    Launchpad[] public launches;

    struct History {
        uint nftId;
        string refCode;
        uint level;
        address user;
        OwnBy ownBy;
        uint256 robiBoost;
        uint createTimestamp;
        uint256 launchIndex;
        bool isUsed;
        bool isDeleted;
        uint256 priceInUSD;
    }
    History[] public histories;

    mapping(address => uint256) public boughtCount; //Bought NFT`s by user: address => launches => tickets count

    event Buy(
        uint256 nftId,
        string refCode,
        address indexed user,
        uint256 launchIndex,
        uint256 robiboost
    );

    event Receive(
        uint256 nftId,
        string refCode,
        address indexed user,
        uint256 launchIndex,
        uint256 robiboost
    );

    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    modifier whenPaused() {
        require(paused);
        _;
    }


     function initialize(
        IWineryNFT _wineryNFT
    ) public initializer {
        __AccessControl_init_unchained();
        __ReentrancyGuard_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        wineryNFT = _wineryNFT;
        treasuryAddress = payable(msg.sender);

        // Init lauches
        launches.push(
            Launchpad({
                totalCount: 4000,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: 1000 ether,
                level: 1,
                robiBoost: 0
            })
        );
        launches.push(
            Launchpad({
                totalCount: 2000,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: 3000 ether,
                level: 2,
                robiBoost: 0
            })
        );
        launches.push(
            Launchpad({
                totalCount: 2000,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: 5000 ether,
                level: 3,
                robiBoost: 0
            })
        );
        launches.push(
            Launchpad({
                totalCount: 2000,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: 10000 ether,
                level: 4,
                robiBoost: 0
            })
        );
        launches.push(
            Launchpad({
                totalCount: 1000,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: 20000 ether,
                level: 5,
                robiBoost: 0
            })
        );
    }


    function setUSDT(address _usdt) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_usdt != address(0), "Must be non zero");
        usdt = _usdt;
    }

    function setMaxToUser(uint32 _max) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_max > 0, "Must gt 0");
        maxToUser = _max;
    }

    /**
     * @notice Set treasury address to accumulate deal tokens from sells
     * @dev Callable by contract owner
     * @param _treasuryAddress: Treasury address
     */
    function setTreasuryAddress(address payable _treasuryAddress)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        treasuryAddress = _treasuryAddress;
    }


    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = true;
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
    }

    /**
     * @notice Add new launchpad
     * @dev Callable by contract owner
     * @param _totalCount: number of NFT tokens for sale in current launchpad
     * @param _priceInUSD: price in USDT for 1 token
     * @param _level: NFT token level
     * @param _robiBoost: NFT token Robi Boost
     */
    function addNewLaunch(
        uint32 _totalCount,
        uint256 _priceInUSD,
        uint32 _level,
        uint256 _robiBoost
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_totalCount > 0, "count must be greater than zero");
        require(_level < 7, "Incorrect level");
        launches.push(
            Launchpad({
                totalCount: _totalCount,
                soldCount: 0,
                sendCount: 0,
                priceInUSD: _priceInUSD,
                level: _level,
                robiBoost: _robiBoost
            })
        );
    }

    function updateLaunch(
        uint32 _index,
        uint32 _totalCount,
        uint256 _priceInUSD,
        uint32 _level,
        uint256 _robiBoost
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_index < launches.length, "Invalid index");
        require(_totalCount > 0, "count must be greater than zero");
        require(_level < 7, "Incorrect level");

        launches[_index].totalCount = _totalCount;
        launches[_index].priceInUSD = _priceInUSD;
        launches[_index].level = _level;
        launches[_index].robiBoost = _robiBoost;
    }

    /**
     * @notice Get how many tokens left to sell from launch
     * @dev Callable by users
     * @param _index: Index of launch
     * @return number of tokens left to sell from launch
     */
    function leftToSell(uint256 _index) public view returns (uint256) {
        require(_index <= launches.length, "Wrong index");
        return launches[_index].totalCount - launches[_index].soldCount - launches[_index].sendCount;
    }


    /**
     * @notice Buy Winery NFT token from launch
     * @dev Callable by user
     * @param _launchIndex: Index of launch
     */
    function buyNFT(uint256 _launchIndex, string calldata _refCode)
        public
        payable
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        require(_launchIndex < launches.length, "Wrong launchpad number");

        Launchpad storage _launch = launches[_launchIndex];
        require(checkLimits(msg.sender, _launchIndex), "limit exceeding");
        boughtCount[msg.sender] += 1;
        _launch.soldCount += 1;

        require(_launch.priceInUSD > 0, "Wrong price given");

        IERC20(usdt).safeTransferFrom(
            msg.sender,
            treasuryAddress,
            _launch.priceInUSD
        );

        uint256 nftId = wineryNFT.launchpadMint(msg.sender, _launch.level, _launch.robiBoost, false);

        // Create history
        histories.push(
            History({
                nftId: nftId,
                refCode: _refCode,
                level: _launch.level,
                user: msg.sender,
                ownBy: OwnBy.Buy,
                robiBoost: _launch.robiBoost,
                createTimestamp: block.timestamp,
                launchIndex: _launchIndex,
                isUsed: false,
                isDeleted: false,
                priceInUSD: _launch.priceInUSD
            })
        );
        historyLength++;

        emit Buy(
            nftId,
            _refCode,
            msg.sender,
            _launchIndex,
            _launch.robiBoost
        );

        return nftId;
    }

    function sentNFT(
        uint256 _launchIndex,
        address _receiver,
        string calldata _refCode,
        bool freeze
    )
        public
        onlyRole(ADMIN_ACTION_ROLE)
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        require(_launchIndex < launches.length, "Wrong launchpad number");

        Launchpad storage _launch = launches[_launchIndex];
        require(checkLimits(_receiver, _launchIndex), "limit exceeding");
        boughtCount[_receiver] += 1;
        _launch.sendCount += 1;

        uint256 nftId = wineryNFT.launchpadMint(_receiver, _launch.level, _launch.robiBoost, freeze);

        // Create history
        histories.push(
            History({
                nftId: nftId,
                refCode: _refCode,
                level: _launch.level,
                user: msg.sender,
                ownBy: OwnBy.Receive,
                robiBoost: _launch.robiBoost,
                createTimestamp: block.timestamp,
                launchIndex: _launchIndex,
                isUsed: false,
                isDeleted: false,
                priceInUSD: _launch.priceInUSD
            })
        );
        historyLength++;

        emit Receive(
            nftId,
            _refCode,
            msg.sender,
            _launchIndex,
            _launch.robiBoost
        );
        
        return nftId;
    }


    /* @notice Check limits left by user by launch
     * @param user: user address
     * @param launchIndex: index of launchpad
     */
    function checkLimits(address user, uint256 launchIndex)
        internal
        view
        returns (bool)
    {
        Launchpad memory launch = launches[launchIndex];
        return
            boughtCount[user] < maxToUser &&
            launch.soldCount + launch.sendCount < launch.totalCount;
    }


    function updateHistory(
        uint256[] memory _ids,
        bool _isUsed,
        bool _isDeleted
    )
        public
        onlyRole(USER_ACTION_ROLE)
        nonReentrant
        whenNotPaused
    {
        for (uint256 i = 0; i < _ids.length; i++) {
            require(_ids[i] < historyLength, "Wrong history index");
        }

        for (uint256 i = 0; i < _ids.length; i++) {
            histories[_ids[i]].isUsed = _isUsed;
            histories[_ids[i]].isDeleted = _isDeleted;
        }
    }

}