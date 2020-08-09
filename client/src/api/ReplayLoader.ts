import EthereumAPI from './EthereumAPI';

class ReplayLoader {
  private ethereumAPI: EthereumAPI;

  private constructor(ethereumAPI: EthereumAPI) {
    this.ethereumAPI = ethereumAPI;
    // this.ethereumAPI.getAllEvents();
  }

  static async create() {
    const ethereumAPI = await EthereumAPI.create();
    return new ReplayLoader(ethereumAPI);
  }
}

export default ReplayLoader;
