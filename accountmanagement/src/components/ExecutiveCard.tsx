interface ExecutiveProps {
  name: string;
  role: string;
  description: string;
  imgSrc?: string;
}

const ExecutiveCard: React.FC<ExecutiveProps> = ({
  name,
  role,
  description,
  imgSrc,
}) => {
  return (
    <div className="executive-card">
      <div className="exec-header">
        <div className="exec-img-placeholder">
          {imgSrc ? (
            <img src={imgSrc} alt={`${name} profile`} loading="lazy" />
          ) : (
            <div className="exec-img-fallback">
              {name.charAt(0) ?? "-"}
            </div>
          )}
        </div>

        <div className="exec-info">
          <h4>{name}</h4>
          <span className="exec-role">{role}</span>
        </div>
      </div>

      <p className="exec-desc">{description}</p>
    </div>
  );
};

export default ExecutiveCard;
