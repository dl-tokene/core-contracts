const { accounts } = require("../scripts/utils/utils");
const { ZERO_ADDR } = require("../scripts/utils/constants");
const {
  CREATE_PERMISSION,
  UPDATE_PERMISSION,
  EXECUTE_PERMISSION,
  DELETE_PERMISSION,
  REVIEWABLE_REQUESTS_RESOURCE,
  RequestStatus,
} = require("./utils/constants");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");

const RequestExecutorMock = artifacts.require("RequestExecutorMock");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");

describe("ReviewableRequests", () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  const ReviewableRequestsRole = "RR";

  const ReviewableRequestsCreate = [REVIEWABLE_REQUESTS_RESOURCE, [CREATE_PERMISSION]];
  const ReviewableRequestsUpdate = [REVIEWABLE_REQUESTS_RESOURCE, [UPDATE_PERMISSION]];
  const ReviewableRequestsExecute = [REVIEWABLE_REQUESTS_RESOURCE, [EXECUTE_PERMISSION]];
  const ReviewableRequestsDelete = [REVIEWABLE_REQUESTS_RESOURCE, [DELETE_PERMISSION]];

  let reviewableRequests;
  let masterAccess;
  let registry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    const _reviewableRequests = await ReviewableRequests.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), _reviewableRequests.address);

    reviewableRequests = await ReviewableRequests.at(await registry.getReviewableRequests());

    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non dependant", async () => {
      await truffleAssert.reverts(reviewableRequests.setDependencies(OWNER), "Dependant: Not an injector");
    });
  });

  describe("createRequest", () => {
    it("should create a reviewable request", async () => {
      await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreate], true);
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      const tx = await reviewableRequests.createRequest(OWNER, "0x00", "0x11", "Simple request", { from: USER1 });

      assert.equal(tx.receipt.logs[0].event, "RequestCreated");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
      assert.equal(tx.receipt.logs[0].args.executor, OWNER);
      assert.equal(tx.receipt.logs[0].args.acceptData, "0x00");
      assert.equal(tx.receipt.logs[0].args.rejectData, "0x11");
      assert.equal(tx.receipt.logs[0].args.description, "Simple request");

      const request = await reviewableRequests.requests(0);

      assert.equal(request.status, RequestStatus.PENDING);
      assert.equal(request.executor, OWNER);
      assert.equal(request.acceptData, "0x00");
      assert.equal(request.rejectData, "0x11");

      assert.equal(await reviewableRequests.nextRequestId(), "1");
    });

    it("should not create reviewable request with zero address executor", async () => {
      await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreate], true);
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await truffleAssert.reverts(
        reviewableRequests.createRequest(ZERO_ADDR, "0x00", "0x11", "Simple request", { from: USER1 }),
        "ReviewableRequests: zero executor"
      );
    });

    it("should not create reviewable request without permissions", async () => {
      await truffleAssert.reverts(
        reviewableRequests.createRequest(OWNER, "0x00", "0x11", "Simple request", { from: USER1 }),
        "ReviewableRequests: access denied"
      );
    });
  });

  describe("updateRequest", () => {
    it("should update a reviewable request (1)", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsUpdate],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(OWNER, "0x00", "0x11", "Simple request", { from: USER1 });
      const tx = await reviewableRequests.updateRequest(0, OWNER, "0x1111", "0x2222", "Updated request", {
        from: USER1,
      });

      assert.equal(tx.receipt.logs[0].event, "RequestUpdated");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
      assert.equal(tx.receipt.logs[0].args.executor, OWNER);
      assert.equal(tx.receipt.logs[0].args.acceptData, "0x1111");
      assert.equal(tx.receipt.logs[0].args.rejectData, "0x2222");
      assert.equal(tx.receipt.logs[0].args.description, "Updated request");

      const request = await reviewableRequests.requests(0);

      assert.equal(request.status, RequestStatus.PENDING);
      assert.equal(request.executor, OWNER);
      assert.equal(request.acceptData, "0x1111");
      assert.equal(request.rejectData, "0x2222");

      assert.equal(await reviewableRequests.nextRequestId(), "1");
    });

    it("should update a reviewable request (2)", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsUpdate],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(OWNER, "0x00", "0x11", "Simple request", { from: USER1 });
      const tx = await reviewableRequests.updateRequest(0, ZERO_ADDR, "0x", "0x", "Left request untouched", {
        from: USER1,
      });

      assert.equal(tx.receipt.logs[0].event, "RequestUpdated");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
      assert.equal(tx.receipt.logs[0].args.executor, ZERO_ADDR);
      assert.equal(tx.receipt.logs[0].args.acceptData, null);
      assert.equal(tx.receipt.logs[0].args.rejectData, null);
      assert.equal(tx.receipt.logs[0].args.description, "Left request untouched");

      const request = await reviewableRequests.requests(0);

      assert.equal(request.status, RequestStatus.PENDING);
      assert.equal(request.executor, OWNER);
      assert.equal(request.acceptData, "0x00");
      assert.equal(request.rejectData, "0x11");

      assert.equal(await reviewableRequests.nextRequestId(), "1");
    });

    it("should not update nonexisting request", async () => {
      await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsUpdate], true);
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await truffleAssert.reverts(
        reviewableRequests.updateRequest(123, OWNER, "0x00", "0x11", "Simple request", { from: USER1 }),
        "ReviewableRequests: invalid request status"
      );
    });

    it("should not create reviewable request without permissions", async () => {
      await truffleAssert.reverts(
        reviewableRequests.updateRequest(0, OWNER, "0x00", "0x11", "Simple request", { from: USER1 }),
        "ReviewableRequests: access denied"
      );
    });
  });

  describe("acceptRequest", () => {
    let executor;

    beforeEach("setup", async () => {
      executor = await RequestExecutorMock.new();
    });

    it("should accept the reviewable request", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        (
          await executor.requestAccept.request()
        ).data,
        "0x",
        "Simple request",
        { from: USER1 }
      );

      const tx = await reviewableRequests.acceptRequest(0, { from: USER1 });

      assert.equal((await reviewableRequests.requests(0)).status, RequestStatus.ACCEPTED);
      assert.equal(await executor.status(), "1");

      assert.equal(tx.receipt.logs[0].event, "RequestAccepted");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
    });

    it("should revert the reviewable request", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        (
          await executor.requestRevert.request()
        ).data,
        "0x",
        "Simple request",
        { from: USER1 }
      );

      await truffleAssert.reverts(
        reviewableRequests.acceptRequest(0, { from: USER1 }),
        "ReviewableRequests: failed to accept request"
      );
    });

    it("should not accept the request twice", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        (
          await executor.requestAccept.request()
        ).data,
        "0x",
        "Simple request",
        { from: USER1 }
      );

      await reviewableRequests.acceptRequest(0, { from: USER1 });
      await truffleAssert.reverts(
        reviewableRequests.acceptRequest(0, { from: USER1 }),
        "ReviewableRequests: invalid request status"
      );
    });

    it("should not accept reviewable request without permission", async () => {
      await truffleAssert.reverts(
        reviewableRequests.acceptRequest(0, { from: USER1 }),
        "ReviewableRequests: access denied"
      );
    });
  });

  describe("rejectRequest", () => {
    let executor;

    beforeEach("setup", async () => {
      executor = await RequestExecutorMock.new();
    });

    it("should reject the reviewable request", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        "0x",
        (
          await executor.requestReject.request()
        ).data,
        "Simple request",
        { from: USER1 }
      );

      const tx = await reviewableRequests.rejectRequest(0, { from: USER1 });

      assert.equal((await reviewableRequests.requests(0)).status, RequestStatus.REJECTED);
      assert.equal(await executor.status(), "2");

      assert.equal(tx.receipt.logs[0].event, "RequestRejected");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
    });

    it("should revert the reviewable request", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        "0x",
        (
          await executor.requestRevert.request()
        ).data,
        "Simple request",
        { from: USER1 }
      );

      await truffleAssert.reverts(
        reviewableRequests.rejectRequest(0, { from: USER1 }),
        "ReviewableRequests: failed to reject request"
      );
    });

    it("should not reject the request twice", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsExecute],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(
        executor.address,
        (
          await executor.requestAccept.request()
        ).data,
        (
          await executor.requestReject.request()
        ).data,
        "Simple request",
        { from: USER1 }
      );

      await reviewableRequests.acceptRequest(0, { from: USER1 });
      await truffleAssert.reverts(
        reviewableRequests.rejectRequest(0, { from: USER1 }),
        "ReviewableRequests: invalid request status"
      );
    });

    it("should not accept reviewable request without permission", async () => {
      await truffleAssert.reverts(
        reviewableRequests.rejectRequest(0, { from: USER1 }),
        "ReviewableRequests: access denied"
      );
    });
  });

  describe("dropRequest", () => {
    it("should drop the reviewable request", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsDelete],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(OWNER, "0x", "0x", "Simple request", { from: USER1 });

      const tx = await reviewableRequests.dropRequest(0, { from: USER1 });

      assert.equal((await reviewableRequests.requests(0)).status, RequestStatus.DROPPED);

      assert.equal(tx.receipt.logs[0].event, "RequestDropped");
      assert.equal(tx.receipt.logs[0].args.requestId, "0");
    });

    it("should not drop the reviewable request twice", async () => {
      await masterAccess.addPermissionsToRole(
        ReviewableRequestsRole,
        [ReviewableRequestsCreate, ReviewableRequestsDelete],
        true
      );
      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      await reviewableRequests.createRequest(OWNER, "0x", "0x", "Simple request", { from: USER1 });

      await reviewableRequests.dropRequest(0, { from: USER1 });
      await truffleAssert.reverts(
        reviewableRequests.dropRequest(0, { from: USER1 }),
        "ReviewableRequests: invalid request status"
      );
    });

    it("should not drop reviewable request without permission", async () => {
      await truffleAssert.reverts(
        reviewableRequests.dropRequest(0, { from: USER1 }),
        "ReviewableRequests: access denied"
      );
    });
  });
});
