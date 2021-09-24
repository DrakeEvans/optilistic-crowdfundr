import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Manager Contract', () => {
  describe('checkTier function', () => {
    it('It should return the correct amounts', async () => {
      const Manager = await ethers.getContractFactory('Manager');
      const manager = await Manager.deploy();
      const [, ...addresses] = await ethers.getSigners();
      await manager.deployed();
      await manager.connect(addresses[0]).registerProject(2e18.toString()).then((tx: any) => tx.wait())
      await manager.connect(addresses[0]).registerProject(2e18.toString()).then((tx: any) => tx.wait())
      await manager.connect(addresses[0]).registerProject(2e18.toString()).then((tx: any) => tx.wait())

      const noTier = await manager.connect(addresses[1]).checkTier(1, addresses[1].address);
      expect(noTier).to.equal('none');

      await manager
        .connect(addresses[1])
        .contributeToProject(1, { value: "1500" })
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
});
