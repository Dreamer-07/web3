import { deployments, ethers, getNamedAccounts } from "hardhat";

async function main() {
  const fundMeDeployment = await deployments.get("FundMe");
  const fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
  console.log(`Got contract FundMe at ${fundMe.target}`);
  console.log("Withdrawing from contract...");

  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait();
  const { deployer } = await getNamedAccounts();
  console.log((await ethers.provider.getBalance(deployer)).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
