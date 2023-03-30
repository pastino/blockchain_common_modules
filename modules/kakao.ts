import axios from "axios";
import { getRepository } from "typeorm";
import { KakaoAccessToken } from "../entities/KakaoAccessToken";

export class Message {
  constructor() {}

  public sendMessage = (text: string) => {
    const sendMessge = new SendMessage();
    sendMessge.sendKakaoMessage({
      object_type: "text",
      text,
      link: {
        mobile_web_url: "",
        web_url: "",
      },
    });
  };
}

export class SendMessage {
  constructor() {}

  private getKakaoToken = async (): Promise<KakaoAccessToken | null> => {
    const kakao = await getRepository(KakaoAccessToken).findOne({
      order: { id: "DESC" },
    });
    if (!kakao) return null;

    return kakao;
  };

  private isTokenExpired = (tokenData: KakaoAccessToken) => {
    const createdTimeStamp = new Date(tokenData?.createAt).getTime();
    const currentTimeStamp = new Date().getTime();

    const passedTimeSecond = (currentTimeStamp - createdTimeStamp) / 1000;
    const expiredTimeSecond = tokenData?.expiresIn;
    const safetyMarginSecond = 60 * 10;

    const isExpired = passedTimeSecond > expiredTimeSecond - safetyMarginSecond;

    if (isExpired) return true;
    return false;
  };

  private createNewToken = async (tokenData: KakaoAccessToken) => {
    try {
      const response = await axios({
        method: "post",
        url: `https://kauth.kakao.com/oauth/token`,
        params: {
          grant_type: "refresh_token",
          client_id: process.env.KAKAO_CLIENT_ID,
          refresh_token: tokenData.refreshToken,
        },
      });

      const data = response?.data;

      await getRepository(KakaoAccessToken).save({
        accessToken: data?.access_token,
        expiresIn: data?.expires_in,
        refreshToken: data?.refresh_token || tokenData?.refreshToken,
        refreshTokenExpiresIn:
          data?.refresh_token_expires_in || tokenData?.refreshTokenExpiresIn,
        scope: tokenData?.scope,
        tokenType: data?.token_type,
      });
    } catch (e) {
      console.log(e);
    }
  };

  public sendKakaoMessage = async (
    kakaoTemplateObject: TextTypeKakaoTemplate
    //  | FeedTypeKakaoTemplate
  ) => {
    let tokenData = await this.getKakaoToken();

    // TODO 카카오 메세지 전송이 불가피한 경우 이메일 전송하도록 처리
    if (!tokenData) return;
    const isExpired = this.isTokenExpired(tokenData);
    if (isExpired) {
      await this.createNewToken(tokenData);
      tokenData = await this.getKakaoToken();
      // TODO 이메일 전송
      if (!tokenData) return;
    }
    try {
      const { accessToken } = tokenData;
      const response = await axios({
        method: "post",
        url: `https://kapi.kakao.com/v2/api/talk/memo/default/send`,
        params: {
          template_object: {
            ...kakaoTemplateObject,
            text: `${kakaoTemplateObject?.text}  PORT - ${process.env.PORT}}`,
          },
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const resultCode = response?.data?.result_code;

      if (resultCode === 0) {
        console.log("카카오 메세지 전송");
      }
    } catch (e: any) {
      console.log("e", e?.message);
    }
  };
}

type TextObjectType = "text";
export interface TextTypeKakaoTemplate {
  object_type: TextObjectType;
  text: string;
  link: { web_url: string; mobile_web_url: string };
  button_title?: string;
}

type FeedObjectType = "feed";
export interface FeedTypeKakaoTemplate {
  object_type: FeedObjectType;
  content: {
    title: string;
    description: string;
    image_url: string;
    image_width: string;
    image_height: string;
    link: {
      web_url: string;
      mobile_web_url: string;
      android_execution_params: string;
      ios_execution_params: string;
    };
  };
  item_content: {
    profile_text: string;
    profile_image_url: string;
    title_image_url: string;
    title_image_text: string;
    title_image_category: string;
    items: {
      item: string;
      item_op: string;
    }[];
  };
  social: {
    like_count: number;
    comment_count: number;
    shared_count: number;
    view_count: number;
    subscriber_count: number;
  };
  buttons: {
    title: string;
    link: {
      web_url: string;
      mobile_web_url: string;
      android_execution_params: string;
      ios_execution_params: string;
    };
  }[];
}
// 타입 참고 - https://developers.kakao.com/docs/latest/ko/message/rest-api#default-template-msg
