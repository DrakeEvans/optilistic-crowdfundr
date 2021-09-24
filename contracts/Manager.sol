//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Manager {
    struct Project {
        uint256 endDate;
        uint256 goalAmount;
        address owner;
        uint256 totalContributions;
    }

    Project[] private projects;

    // address => projectId => amount
    mapping(address => mapping(uint256 => uint256)) totalContributionsByAddressByProjectId;


    event ProjectRegistered(address indexed _owner, uint indexed _projectId);

    modifier projectOwnerOnly(uint256 _projectId) {
        require(
            msg.sender == projects[_projectId].owner,
            "Called by address other than project owner"
        );
        _;
    }

    modifier isNotExpired(uint256 _projectId) {
        require(block.timestamp <= projects[_projectId].endDate, "Only called after project Expiration");
        _;
    }

    modifier isExpired(uint256 _projectId) {
        require(block.timestamp > projects[_projectId].endDate);
        _;
    }

    modifier isUnderLimit(uint256 _projectId) {
        require(projects[_projectId].totalContributions < projects[_projectId].goalAmount);
        _;
    }

    modifier isFullySubscribed(uint256 _projectId) {
        require(projects[_projectId].totalContributions >= projects[_projectId].goalAmount);
        _;
    }

    function checkTier(uint256 _projectId, address _address) public view returns (string memory){
        uint256 _contribution = totalContributionsByAddressByProjectId[_address][_projectId];
        if (_contribution >= 1 ether) {
            return "gold";
        }
        if (_contribution > 0.25 ether) {
            return "silver";
        }
        if (_contribution > 0 ether) {
            return "bronze";
        }
        return "none";
    }

    function requestRefund(uint256 _projectId) external isExpired(_projectId) isUnderLimit(_projectId) {
        uint256 valueToSend = totalContributionsByAddressByProjectId[msg.sender][_projectId];
        totalContributionsByAddressByProjectId[msg.sender][_projectId] = 0;
        require(valueToSend > 0, "No funds to refund");
        (bool sent,) = msg.sender.call{value: valueToSend}("");
        require(sent, "Failed to send Ether");
    }

    function withdrawFunds(uint256 _projectId) external isExpired(_projectId) isFullySubscribed(_projectId) projectOwnerOnly(_projectId) {
        uint256 valueToSend = projects[_projectId].totalContributions;
        projects[_projectId].totalContributions = 0;
        require(valueToSend > 0, "No funds to withdraw");
        (bool sent,) = msg.sender.call{value: valueToSend}("");
        require(sent, "Failed to withdraw Ether]");
    }

    function registerProject(uint _goalAmount) external returns (uint){
        Project memory myProject = Project({ endDate: block.timestamp + 30 days, goalAmount: _goalAmount, owner: msg.sender, totalContributions: 0});
        projects.push(myProject);
        uint id = projects.length - 1;
        emit ProjectRegistered(msg.sender, id);
        return id;
    }

    function contributeToProject(uint _projectId) external payable isUnderLimit(_projectId) isNotExpired(_projectId) {
        totalContributionsByAddressByProjectId[msg.sender][_projectId] += msg.value;
        projects[_projectId].totalContributions += msg.value;
    }
}
