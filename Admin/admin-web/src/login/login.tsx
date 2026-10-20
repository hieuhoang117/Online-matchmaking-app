import { useState } from 'react'
import {
	ArrowRightOutlined,
	CloudOutlined,
	GlobalOutlined,
	KeyOutlined,
	LockOutlined,
	MailOutlined,
	QuestionCircleOutlined,
	SafetyCertificateOutlined,
	TeamOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Divider, Form, Input, Tag, Typography } from 'antd'
import './login.css'

function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [rememberDevice, setRememberDevice] = useState(true)

	return (
		<main className="login-page">
			<aside className="brand-panel">
				<div className="brand-content">
					<div className="brand-lockup">
						<span className="brand-mark"><SafetyCertificateOutlined /></span>
						<span>
							<strong>Apex Admin</strong>
							<small>QUẢN TRỊ NỀN TẢNG</small>
						</span>
					</div>

					<div className="brand-message">
						<Tag className="version-tag"><span className="status-dot" />Nền tảng bảo mật Amour v2.4</Tag>
						<Typography.Title level={1}>
							Kiến tạo niềm tin, an toàn và quản trị nền tảng.
						</Typography.Title>
						<Typography.Paragraph>
							Bảng điều khiển quản lý tập trung với thông tin kiểm toán theo thời gian thực,
							công cụ chính sách hành vi và khả năng quản trị trên nhiều khu vực.
						</Typography.Paragraph>

						<ul className="feature-list">
							<li><SafetyCertificateOutlined />Giám sát liên tục và phát hiện bất thường</li>
							<li><KeyOutlined />Tích hợp passkey phần cứng và SAML 2.0</li>
							<li><LockOutlined />Nhật ký bất biến phục vụ giám sát tuân thủ</li>
						</ul>
					</div>
				</div>

				<footer className="system-status">
					<span><i className="status-dot" />Trạng thái hệ thống: Đang hoạt động</span>
					<span className="region-label">EU-Trung tâm</span>
					<span className="compliance-label">SOC2 Type II · ISO 27001</span>
				</footer>
			</aside>

			<section className="login-panel">
				<header className="topbar">
					<Tag className="region-tag"><CloudOutlined />Môi trường thật: FRA-01 (Frankfurt)</Tag>
					<div className="topbar-links">
						<span><GlobalOutlined /> VI-VN</span>
						<span className="topbar-divider" />
						<span><QuestionCircleOutlined /> Hỗ trợ</span>
					</div>
				</header>

				<div className="login-content">
					<Typography.Title level={2}>Đăng nhập vào tài khoản</Typography.Title>
					<Typography.Paragraph className="login-intro">
						Nhập thông tin quản trị để truy cập bảng điều khiển kiểm duyệt và quản lý.
					</Typography.Paragraph>

					<Form layout="vertical" requiredMark={false} className="login-form" component="div">
						<Form.Item
							label={<span className="field-label">Email công việc hoặc mã quản trị <span>SSO đang bật</span></span>}
						>
							<Input
								size="large"
								prefix={<MailOutlined />}
								placeholder="ten@congty.com hoặc mã quản trị"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="username"
							/>
						</Form.Item>

						<Form.Item
							label={
								<span className="field-label">
									Mật khẩu
									<Button type="link" className="forgot-link">Quên mật khẩu?</Button>
								</span>
							}
						>
							<Input.Password
								size="large"
								prefix={<LockOutlined />}
								placeholder="Nhập mật khẩu doanh nghiệp"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete="current-password"
							/>
						</Form.Item>

						<div className="form-options">
							<Checkbox
								checked={rememberDevice}
								onChange={(event) => setRememberDevice(event.target.checked)}
							>
								Ghi nhớ thiết bị này trong 30 ngày
							</Checkbox>
							<span className="mfa-status"><LockOutlined />MFA đang bật</span>
						</div>

						<Button type="primary" size="large" className="submit-button" htmlType="button">
							Đăng nhập vào bảng điều khiển <ArrowRightOutlined />
						</Button>

						<Divider plain className="signin-divider">HOẶC ĐĂNG NHẬP BẰNG</Divider>

						<Button className="sso-button" block icon={<KeyOutlined />}>
							Đăng nhập một lần (Okta / Azure SAML)
						</Button>
						<Button type="text" className="hardware-button" icon={<TeamOutlined />}>
							Xác thực bằng FIDO2 / khóa bảo mật phần cứng
						</Button>

						<div className="security-note">
							<SafetyCertificateOutlined />
							<span>
									Được bảo vệ bởi cổng truy cập zero-trust doanh nghiệp. Thông tin phiên,
									địa chỉ IP máy khách và mã cấp quyền được ký mật mã và kiểm toán.
							</span>
						</div>
					</Form>
				</div>

				<footer className="legal-footer">
						<span>© 2025 Apex Global Governance Inc.</span>
						<Button type="link">Thông báo quyền riêng tư</Button>
					<span>•</span>
						<Button type="link">Tiêu chuẩn bảo mật</Button>
					<span>•</span>
						<Button type="link">Chấp thuận thu thập dữ liệu</Button>
				</footer>
			</section>
		</main>
	)
}

export default Login
