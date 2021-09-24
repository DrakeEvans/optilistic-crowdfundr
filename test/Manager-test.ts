import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Manager Contract', () => {
  describe('checkTier function', () => {
    it('It should return the correct amounts', async () => {
      const Manager = await ethers.getContractFactory('Manager');
      const manager = await Manager.deploy();
      const [, ...addresses] = await ethers.getSigners();
      await manager.deployed();
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());

      const noTier = await manager.connect(addresses[1]).checkTier(1, addresses[1].address);
      expect(noTier).to.equal('none');

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: '1500' })
        .then((tx: any) => tx.wait());
      const bronzeTier = await manager.connect(addresses[1]).checkTier(1, addresses[1].address);
      expect(bronzeTier).to.equal('bronze');

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: (0.25 * 1e18).toString() })
        .then((tx: any) => tx.wait());
      const silverTier = await manager.connect(addresses[1]).checkTier(1, addresses[1].address);
      expect(silverTier).to.equal('silver');

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: (1 * 1e18).toString() })
        .then((tx: any) => tx.wait());
      const goldTier = await manager.connect(addresses[1]).checkTier(1, addresses[1].address);
      expect(goldTier).to.equal('gold');
    });
  });
  describe('contribute function', () => {
    it('When contributing, contract should correctly sum the amount of contributions', async () => {
      const Manager = await ethers.getContractFactory('Manager');
      const manager = await Manager.deploy();
      const [, ...addresses] = await ethers.getSigners();
      await manager.deployed();
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: '1500' })
        .then((tx: any) => tx.wait());
      const response = await manager.totalContributionsByAddressByProjectId(addresses[1].address, 1);
      expect(response).to.equal(ethers.BigNumber.from('1500'));

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: (0.25 * 1e18).toString() })
        .then((tx: any) => tx.wait());
      const secondSum = await manager.totalContributionsByAddressByProjectId(addresses[1].address, 1);
      expect(secondSum).to.equal(ethers.BigNumber.from((1500 + 0.25 * 1e18).toString()));

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: (1 * 1e18).toString() })
        .then((tx: any) => tx.wait());
      const thirdSum = await manager.totalContributionsByAddressByProjectId(addresses[1].address, 1);
      expect(thirdSum).to.equal(ethers.BigNumber.from((1500 + 1.25 * 1e18).toString()));
    });
  });
  describe('Regsitration function', () => {
    it('When registering a project, it should correctly store the project', async () => {
      const Manager = await ethers.getContractFactory('Manager');
      const manager = await Manager.deploy();
      const [, ...addresses] = await ethers.getSigners();
      await manager.deployed();
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      const mineResponse = await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      const block = await ethers.provider.getBlock(mineResponse.blockNumber);

      const response = await manager.projects(1);
      const timePlus30 = block.timestamp + 30 * 24 * 60 * 60;
      expect(response).to.deep.equal([
        ethers.BigNumber.from(timePlus30.toString()),
        ethers.BigNumber.from((2e18).toString()),
        addresses[0].address,
        ethers.BigNumber.from((0).toString()),
      ]);
    });
    it('Should not allow withdrawal before contribution met', async () => {
      const Manager = await ethers.getContractFactory('Manager');
      const manager = await Manager.deploy();
      const [, ...addresses] = await ethers.getSigners();
      await manager.deployed();
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());
      await manager
        .connect(addresses[0])
        .registerProject((2e18).toString())
        .then((tx: any) => tx.wait());

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: '1500' })
        .then((tx: any) => tx.wait());

      expect(
        manager
          .connect(addresses[0])
          .withdrawFunds(1, 100)
          .then((tx: any) => tx.wait())
      ).to.be.revertedWith('Project not fully subscribed');

    });
  });
});
