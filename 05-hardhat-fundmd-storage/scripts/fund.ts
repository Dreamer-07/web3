import { deployments, ethers } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";

async function main() {
  // 获取合同的部署信息
  const fundMeDeployment: Deployment = await deployments.get("FundMe");
  const fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
  console.log(`Got contract FundMe at ${fundMe.target}`);
  console.log("Funding contract...");

  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.1"),
  });
  await transactionResponse.wait();
  console.log("Funded!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
