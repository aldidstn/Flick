// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FlickRegistry} from "../src/FlickRegistry.sol";

contract MockToken {
    mapping(address account => uint256 balance) public balanceOf;
    mapping(address owner => mapping(address spender => uint256 amount)) public allowance;

    function mint(address account, uint256 amount) external {
        balanceOf[account] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "balance");
        require(allowance[from][msg.sender] >= amount, "allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract FlickRegistryTest {
    MockToken private usdc;
    MockToken private eurc;
    FlickRegistry private registry;

    function setUp() public {
        usdc = new MockToken();
        eurc = new MockToken();
        registry = new FlickRegistry(address(usdc), address(eurc));
        usdc.mint(address(this), 1_000_000_000);
        eurc.mint(address(this), 1_000_000_000);
        usdc.approve(address(registry), type(uint256).max);
        eurc.approve(address(registry), type(uint256).max);
    }

    function testClaimNickname() public {
        registry.claimNickname("aldidesign");

        require(registry.creatorOf("aldidesign") == address(this), "creator mismatch");
        require(_same(registry.nicknameOf(address(this)), "aldidesign"), "nickname mismatch");
    }

    function testRejectsInvalidNickname() public {
        try registry.claimNickname("Al") {
            revert("expected invalid nickname");
        } catch {}

        try registry.claimNickname("aldi-design") {
            revert("expected invalid nickname");
        } catch {}
    }

    function testRejectsSecondNicknameForSameCreator() public {
        registry.claimNickname("aldidesign");

        try registry.claimNickname("flickdemo") {
            revert("expected creator already claimed");
        } catch {}
    }

    function testTracksUsdcTips() public {
        registry.claimNickname("aldidesign");
        registry.tipUSDC("aldidesign", 25_000_000, "Mira", "Great work");

        require(registry.totalUsdcTipsReceived(address(this)) == 25_000_000, "usdc total");
    }

    function testTracksEurcTips() public {
        registry.claimNickname("aldidesign");
        registry.tipEURC("aldidesign", 12_000_000, "Jonas", "Merci");

        require(registry.totalEurcTipsReceived(address(this)) == 12_000_000, "eurc total");
    }

    function testRejectsZeroTip() public {
        registry.claimNickname("aldidesign");

        try registry.tipUSDC("aldidesign", 0, "Mira", "Nope") {
            revert("expected empty amount");
        } catch {}
    }

    function _same(string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
