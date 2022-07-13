import BossRaid from '../../models/bossraid.js';
import enterCheck from '../../modules/enter-check.js';
//import { logger } from '../../config/winston.js';
import statusCode from '../../utils/status-code.js';
import message from '../../utils/response-message.js';
import { errResponse, response } from '../../utils/response.js';
import { Op } from 'sequelize';

const bossRaidInfo = async (req) => {
  /**
   * @author 박성용
   * @version 1.0 22.07.12 보스레이드 정보 조회 기능
   */
  try {
    let bossRaidInfo = await BossRaid.findAll();

    let canEnter, enteredUserId;

    for (const key in bossRaidInfo) {
      enteredUserId = bossRaidInfo[key].enteredUserId;

      // 현재 입장한 유저가 없으면 입장 가능
      if (!enteredUserId) {
        canEnter = bossRaidInfo[key]['canEnter'] = enterCheck(1);
      } else {
        canEnter = bossRaidInfo[key]['canEnter'] = enterCheck(0);
      }
    }
    const data = {
      canEnter: canEnter,
      enteredUserId: enteredUserId,
    };

    // 성공시
    return response(statusCode.OK, message.SUCCESS, data);
  } catch (err) {
    return errResponse(statusCode.BAD_REQUEST, message.BAD_REQUEST);
  }
};

const bossRaidEnter = async (userId, level) => {
  /**
   * @author 김영우
   * @version 1.0 22.07.12 보스레이드 시작 기능
   *
   * @author 박성용
   * @version 1.1 22.07.13 보스레이드 시작시 현재 입장한 유저와 입장여부 업데이트
   */
  try {
    const bossRaids = await BossRaid.findAll();
    const isEnter = bossRaids.filter(
      (bossRaid) =>
        bossRaid.enteredUserId !== null && bossRaid.canEnter !== true,
    )[0];
    if (isEnter) {
      return [statusCode.OK, response(statusCode.OK, { isEntered: false })];
    } else {
      const bossRaid = await BossRaid.create({
        user_id: userId,
        level,
        canEnter: false,
        enteredUserId: userId,
      });
      console.log(bossRaid.id);

      await BossRaid.update(
        { enteredUserId: bossRaid.enteredUserId, canEnter: false },
        {
          where: {
            // enteredUserId >= 1
            enteredUserId: { [Op.gte]: 1 },
          },
        },
      );

      const data = {
        isEntered: true,
        raidRecordId: bossRaid.id,
      };
      return [
        statusCode.CREATED,
        response(statusCode.CREATED, message.SUCCESS, data),
      ];
    }
  } catch (err) {
    console.error(err);
    return [
      statusCode.INTERNAL_SERVER_ERROR,
      errResponse(
        statusCode.INTERNAL_SERVER_ERROR,
        message.INTERNAL_SERVER_ERROR,
      ),
    ];
  }
};

export default {
  bossRaidInfo,
  bossRaidEnter,
};
